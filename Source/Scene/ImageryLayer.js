/*global define*/
define([
        '../Core/combine',
        '../Core/defaultValue',
        '../Core/destroyObject',
        '../Core/DeveloperError',
        '../Core/Math',
        '../Core/Cartesian2',
        '../Core/Extent',
        '../Core/PlaneTessellator',
        '../Core/PrimitiveType',
        '../Renderer/MipmapHint',
        '../Renderer/TextureMinificationFilter',
        '../Renderer/TextureMagnificationFilter',
        '../Renderer/TextureWrap',
        './GeographicTilingScheme',
        './Imagery',
        './ImageryState',
        './Tile',
        './TileImagery',
        './TexturePool',
        './Projections',
        '../ThirdParty/when'
    ], function(
        combine,
        defaultValue,
        destroyObject,
        DeveloperError,
        CesiumMath,
        Cartesian2,
        Extent,
        PlaneTessellator,
        PrimitiveType,
        MipmapHint,
        TextureMinificationFilter,
        TextureMagnificationFilter,
        TextureWrap,
        GeographicTilingScheme,
        Imagery,
        ImageryState,
        Tile,
        TileImagery,
        TexturePool,
        Projections,
        when) {
    "use strict";

    /**
     * An imagery layer that display tiled image data from a single imagery provider
     * on a central body.
     *
     * @name ImageryLayer
     *
     * @param {ImageryProvider} imageryProvider the imagery provider to use.
     * @param {Extent} [description.extent=imageryProvider.extent] The extent of the layer.
     * @param {Number} [description.maxScreenSpaceError=1.0] DOC_TBA
     * @param {Number} [description.alpha=1.0] The alpha blending value of this layer, from 0.0 to 1.0.
     */
    function ImageryLayer(imageryProvider, description) {
        this.imageryProvider = imageryProvider;

        description = defaultValue(description, {});

        this.extent = defaultValue(description.extent, imageryProvider.extent);
        this.extent = defaultValue(this.extent, Extent.MAX_VALUE);

        /**
         * DOC_TBA
         *
         * @type {Number}
         */
        this.maxScreenSpaceError = defaultValue(description.maxScreenSpaceError, 1.0);

        this._imageryCache = {};
        this._texturePool = new TexturePool();

        /**
         * The alpha blending value of this layer, from 0.0 to 1.0.
         *
         * @type {Number}
         */
        this.alpha = defaultValue(description.alpha, 1.0);

        this._tileFailCount = 0;

        /**
         * The maximum number of tiles that can fail consecutively before the
         * layer will stop loading tiles.
         *
         * @type {Number}
         */
        this.maxTileFailCount = 10;

        /**
         * The maximum number of failures allowed for each tile before the
         * layer will stop loading a failing tile.
         *
         * @type {Number}
         */
        this.perTileMaxFailCount = 3;

        /**
         * The number of seconds between attempts to retry a failing tile.
         *
         * @type {Number}
         */
        this.failedTileRetryTime = 5.0;

        this._levelZeroMaximumTexelSpacing = undefined;

        this._spReproject = undefined;
        this._vaReproject = undefined;
        this._fbReproject = undefined;
    }

    /**
     * Gets the level with the specified world coordinate spacing between texels, or less.
     *
     * @param {Number} texelSpacing The texel spacing for which to find a corresponding level.
     * @param {Number} latitudeClosestToEquator The latitude closest to the equator that we're concerned with.
     * @returns {Number} The level with the specified texel spacing or less.
     */
    ImageryLayer.prototype._getLevelWithMaximumTexelSpacing = function(texelSpacing, latitudeClosestToEquator) {
        var levelZeroMaximumTexelSpacing = this._levelZeroMaximumTexelSpacing;
        //if (typeof levelZeroMaximumTexelSpacing === 'undefined') {
            var imageryProvider = this.imageryProvider;
            var tilingScheme = imageryProvider.tilingScheme;
            var ellipsoid = tilingScheme.ellipsoid;
            var latitudeFactor = Math.cos(latitudeClosestToEquator);
            //var latitudeFactor = 1.0;
            levelZeroMaximumTexelSpacing = ellipsoid.getMaximumRadius() * 2 * Math.PI * latitudeFactor / (imageryProvider.tileWidth * tilingScheme.numberOfLevelZeroTilesX);
            this._levelZeroMaximumTexelSpacing = levelZeroMaximumTexelSpacing;
        //}

        var twoToTheLevelPower = this._levelZeroMaximumTexelSpacing / texelSpacing;
        var level = Math.log(twoToTheLevelPower) / Math.log(2);

        // Round the level up, unless it's really close to the lower integer.
//        var ceiling = Math.ceil(level);
//        if (ceiling - level > 0.99) {
//            ceiling -= 1;
//        }
//        return ceiling | 0;
        var rounded = Math.round(level);
        return rounded | 0;
    };

    ImageryLayer.prototype.createTileImagerySkeletons = function(tile, terrainProvider) {
        var imageryCache = this._imageryCache;
        var imageryProvider = this.imageryProvider;
        var imageryTilingScheme = imageryProvider.tilingScheme;

        // Compute the extent of the imagery from this imageryProvider that overlaps
        // the geometry tile.  The ImageryProvider and ImageryLayer both have the
        // opportunity to constrain the extent.  The imagery TilingScheme's extent
        // always fully contains the ImageryProvider's extent.
        var extent = tile.extent.intersectWith(imageryProvider.extent);
        extent = extent.intersectWith(this.extent);

        if (extent.east <= extent.west ||
            extent.north <= extent.south) {
            // There is no overlap between this terrain tile and this imagery
            // provider, so no skeletons need to be created.
            return false;
        }

        var latitudeClosestToEquator = 0.0;
        if (extent.south > 0.0) {
            latitudeClosestToEquator = extent.south;
        } else if (extent.north < 0.0) {
            latitudeClosestToEquator = extent.north;
        }

        // Compute the required level in the imagery tiling scheme.
        // TODO: this should be imagerySSE / terrainSSE.
        var errorRatio = 1.0;
        var targetGeometricError = errorRatio * terrainProvider.getLevelMaximumGeometricError(tile.level);
        var imageryLevel = this._getLevelWithMaximumTexelSpacing(targetGeometricError, latitudeClosestToEquator);
        imageryLevel = Math.max(0, Math.min(imageryProvider.maxLevel, imageryLevel));

        var northwestTileCoordinates = imageryTilingScheme.positionToTileXY(extent.getNorthwest(), imageryLevel);
        var southeastTileCoordinates = imageryTilingScheme.positionToTileXY(extent.getSoutheast(), imageryLevel);

        // If the southeast corner of the extent lies very close to the north or west side
        // of the southeast tile, we don't actually need the southernmost or easternmost
        // tiles.
        // Similarly, if the northwest corner of the extent list very close to the south or east side
        // of the northwest tile, we don't actually need the northernmost or westernmost tiles.
        // TODO: The northwest corner is especially sketchy...  Should we be doing something
        // elsewhere to ensure better alignment?
        // TODO: Is CesiumMath.EPSILON10 the right epsilon to use?
        var northwestTileExtent = imageryTilingScheme.tileXYToExtent(northwestTileCoordinates.x, northwestTileCoordinates.y, imageryLevel);
        if (Math.abs(northwestTileExtent.south - extent.north) < CesiumMath.EPSILON10) {
            ++northwestTileCoordinates.y;
        }
        if (Math.abs(northwestTileExtent.east - extent.west) < CesiumMath.EPSILON10) {
            ++northwestTileCoordinates.x;
        }

        var southeastTileExtent = imageryTilingScheme.tileXYToExtent(southeastTileCoordinates.x, southeastTileCoordinates.y, imageryLevel);
        if (Math.abs(southeastTileExtent.north - extent.south) < CesiumMath.EPSILON10) {
            --southeastTileCoordinates.y;
        }
        if (Math.abs(southeastTileExtent.west - extent.east) < CesiumMath.EPSILON10) {
            --southeastTileCoordinates.x;
        }

        // Create TileImagery instances for each imagery tile overlapping this terrain tile.
        // We need to do all texture coordinate computations in the imagery tile's tiling scheme.
        var terrainExtent = imageryTilingScheme.extentToNativeExtent(tile.extent);
        var terrainWidth = terrainExtent.east - terrainExtent.west;
        var terrainHeight = terrainExtent.north - terrainExtent.south;

        var imageryExtent = imageryTilingScheme.tileXYToExtent(northwestTileCoordinates.x, northwestTileCoordinates.y, imageryLevel);

        var minU;
        var maxU = Math.min(1.0, (imageryExtent.west - tile.extent.west) / (tile.extent.east - tile.extent.west));

        var minV = Math.max(0.0, (imageryExtent.north - tile.extent.south) / (tile.extent.north - tile.extent.south));
        var maxV;

        for (var i = northwestTileCoordinates.x; i <= southeastTileCoordinates.x; i++) {
            minU = maxU;

            imageryExtent = imageryTilingScheme.tileXYToExtent(i, northwestTileCoordinates.y, imageryLevel);
            maxU = Math.min(1.0, (imageryExtent.east - tile.extent.west) / (tile.extent.east - tile.extent.west));

            for (var j = northwestTileCoordinates.y; j <= southeastTileCoordinates.y; j++) {

                var cacheKey = getImageryCacheKey(i, j, imageryLevel);
                var imagery = imageryCache[cacheKey];

                if (typeof imagery === 'undefined') {
                    imagery = new Imagery(this, i, j, imageryLevel);
                    imageryCache[cacheKey] = imagery;
                }

                imagery.addReference();

                maxV = minV;

                imageryExtent = imageryTilingScheme.tileXYToExtent(i, j, imageryLevel);
                minV = Math.max(0.0, (imageryExtent.south - tile.extent.south) / (tile.extent.north - tile.extent.south));

                imageryExtent = imageryTilingScheme.tileXYToNativeExtent(i, j, imageryLevel);
                var textureTranslation = new Cartesian2(
                        (imageryExtent.west - terrainExtent.west) / terrainWidth,
                        (imageryExtent.south - terrainExtent.south) / terrainHeight);

                var textureScale = new Cartesian2(
                        (imageryExtent.east - imageryExtent.west) / terrainWidth,
                        (imageryExtent.north - imageryExtent.south) / terrainHeight);

                var minTexCoords = new Cartesian2(minU, minV);
                var maxTexCoords = new Cartesian2(maxU, maxV);

                tile.imagery.push(new TileImagery(imagery, textureTranslation, textureScale, minTexCoords, maxTexCoords));
            }
        }

        return true;
    };

    var activeTileImageRequests = {};

    ImageryLayer.prototype.requestImagery = function(imagery) {
        var imageryProvider = this.imageryProvider;
        var hostname;

        when(imageryProvider.buildImageUrl(imagery.x, imagery.y, imagery.level), function(imageUrl) {
            hostname = getHostname(imageUrl);
            if (hostname !== '') {
                var activeRequestsForHostname = defaultValue(activeTileImageRequests[hostname], 0);

                // Cap image requests per hostname, because the browser itself is capped,
                // and we have no way to cancel an image load once it starts, but we need
                // to be able to reorder pending image requests.
                if (activeRequestsForHostname > 6) {
                    // postpone loading tile
                    imagery.state = ImageryState.UNLOADED;
                    return false;
                }

                activeTileImageRequests[hostname] = activeRequestsForHostname + 1;
            }

            imagery.imageUrl = imageUrl;
            return imageryProvider.requestImage(imageUrl);
        }).then(function(image) {
            if (typeof image === 'boolean') {
                return;
            }

            activeTileImageRequests[hostname]--;

            imagery.image = image;

            if (typeof image === 'undefined') {
                imagery.state = ImageryState.INVALID;
                return;
            }

            imagery.state = ImageryState.RECEIVED;
        }, function(e) {
            /*global console*/
            console.error('failed to load imagery: ' + e);
            imagery.state = ImageryState.FAILED;
        });
    };

    ImageryLayer.prototype.createTexture = function(context, imagery) {
        var texture = this._texturePool.createTexture2D(context, {
            source : imagery.image
        });

        imagery.texture = texture;
        imagery.image = undefined;
        imagery.state = ImageryState.TEXTURE_LOADED;
    };

    ImageryLayer.prototype.reprojectTexture = function(context, imagery) {
        var texture = imagery.texture;

        // Reproject to geographic, if necessary.
        if (!(this.imageryProvider.tilingScheme instanceof GeographicTilingScheme)) {
            /*texture.setSampler({
                wrapS : TextureWrap.CLAMP,
                wrapT : TextureWrap.CLAMP,
                minificationFilter : TextureMinificationFilter.LINEAR,
                magnificationFilter : TextureMagnificationFilter.LINEAR
            });



            context.draw({
                framebuffer : this._fbReproject,
                shaderProgram : this._spReproject,
                renderState : this._rsColor,
                primitiveType : PrimitiveType.TRIANGLE_FAN,
                vertexArray : this._vaReproject,
                uniformMap : uniformMap
            });*/
        }

        texture.generateMipmap(MipmapHint.NICEST);
        texture.setSampler({
            wrapS : TextureWrap.CLAMP,
            wrapT : TextureWrap.CLAMP,
            minificationFilter : TextureMinificationFilter.LINEAR_MIPMAP_LINEAR,
            magnificationFilter : TextureMagnificationFilter.LINEAR,

            // TODO: Remove Chrome work around
            maximumAnisotropy : context.getMaximumTextureFilterAnisotropy() || 8
        });


        imagery.state = ImageryState.READY;
    };

    ImageryLayer.prototype.removeImageryFromCache = function(imagery) {
        var cacheKey = getImageryCacheKey(imagery.x, imagery.y, imagery.level);
        delete this._imageryCache[cacheKey];
    };

    function getImageryCacheKey(x, y, level) {
        return JSON.stringify([x, y, level]);
    }

    var anchor;
    function getHostname(url) {
        if (typeof anchor === 'undefined') {
            anchor = document.createElement('a');
        }
        anchor.href = url;
        return anchor.hostname;
    }

    /**
     * Returns true if this object was destroyed; otherwise, false.
     * <br /><br />
     * If this object was destroyed, it should not be used; calling any function other than
     * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.
     *
     * @memberof ImageryLayer
     *
     * @return {Boolean} True if this object was destroyed; otherwise, false.
     *
     * @see ImageryLayer#destroy
     */
    ImageryLayer.prototype.isDestroyed = function() {
        return false;
    };

    /**
     * Destroys the WebGL resources held by this object.  Destroying an object allows for deterministic
     * release of WebGL resources, instead of relying on the garbage collector to destroy this object.
     * <br /><br />
     * Once an object is destroyed, it should not be used; calling any function other than
     * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.  Therefore,
     * assign the return value (<code>undefined</code>) to the object as done in the example.
     *
     * @memberof ImageryLayer
     *
     * @return {undefined}
     *
     * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
     *
     * @see ImageryLayer#isDestroyed
     *
     * @example
     * imageryLayer = imageryLayer && imageryLayer.destroy();
     */
    ImageryLayer.prototype.destroy = function() {
        this._texturePool = this._texturePool && this._texturePool.destroy();

        return destroyObject(this);
    };

    return ImageryLayer;
});