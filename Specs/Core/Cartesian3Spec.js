/*global defineSuite*/
defineSuite([
             'Core/Cartesian3',
             'Core/Math',
             'Specs/createPackableSpecs'
            ], function(
              Cartesian3,
              CesiumMath,
              createPackableSpecs) {
    "use strict";
    /*global jasmine,describe,xdescribe,it,xit,expect,beforeEach,afterEach,beforeAll,afterAll,spyOn,runs,waits,waitsFor*/

    it('construct with default values', function() {
        var cartesian = new Cartesian3();
        expect(cartesian.x).toEqual(0.0);
        expect(cartesian.y).toEqual(0.0);
        expect(cartesian.z).toEqual(0.0);
    });

    it('construct with all values', function() {
        var cartesian = new Cartesian3(1.0, 2.0, 3.0);
        expect(cartesian.x).toEqual(1.0);
        expect(cartesian.y).toEqual(2.0);
        expect(cartesian.z).toEqual(3.0);
    });

    var fortyFiveDegrees = Math.PI / 4.0;
    var sixtyDegrees = Math.PI / 3.0;
    var cartesian = new Cartesian3(1.0, Math.sqrt(3.0), -2.0);
    var spherical = {
        clock : sixtyDegrees,
        cone : (fortyFiveDegrees + Math.PI / 2.0),
        magnitude : Math.sqrt(8.0)
    };

    it('convert Spherical to a new Cartesian3 instance', function() {
        expect(cartesian).toEqualEpsilon(Cartesian3.fromSpherical(spherical), CesiumMath.EPSILON15);
    });

    it('convert Spherical to an existing Cartesian3 instance', function() {
        var existing = new Cartesian3();
        expect(cartesian).toEqualEpsilon(Cartesian3.fromSpherical(spherical, existing), CesiumMath.EPSILON15);
        expect(cartesian).toEqualEpsilon(existing, CesiumMath.EPSILON15);
    });

    it('fromArray creates a Cartesian3', function() {
        var cartesian = Cartesian3.fromArray([1.0, 2.0, 3.0]);
        expect(cartesian).toEqual(new Cartesian3(1.0, 2.0, 3.0));
    });

    it('fromArray with an offset creates a Cartesian3', function() {
        var cartesian = Cartesian3.fromArray([0.0, 1.0, 2.0, 3.0, 0.0], 1);
        expect(cartesian).toEqual(new Cartesian3(1.0, 2.0, 3.0));
    });

    it('fromArray creates a Cartesian3 with a result parameter', function() {
        var cartesian = new Cartesian3();
        var result = Cartesian3.fromArray([1.0, 2.0, 3.0], 0, cartesian);
        expect(result).toBe(cartesian);
        expect(result).toEqual(new Cartesian3(1.0, 2.0, 3.0));
    });

    it('fromArray throws without values', function() {
        expect(function() {
            Cartesian3.fromArray();
        }).toThrow();
    });

    it('fromArray throws with an invalid offset', function() {
        expect(function() {
            Cartesian3.fromArray([0.0, 0.0, 0.0], 1);
        }).toThrow();
    });

    it('clone without a result parameter', function() {
        var cartesian = new Cartesian3(1.0, 2.0, 3.0);
        var result = cartesian.clone();
        expect(cartesian).toNotBe(result);
        expect(cartesian).toEqual(result);
    });

    it('clone with a result parameter', function() {
        var cartesian = new Cartesian3(1.0, 2.0, 3.0);
        var result = new Cartesian3();
        var returnedResult = cartesian.clone(result);
        expect(cartesian).toNotBe(result);
        expect(result).toBe(returnedResult);
        expect(cartesian).toEqual(result);
    });

    it('clone works with "this" result parameter', function() {
        var cartesian = new Cartesian3(1.0, 2.0, 3.0);
        var returnedResult = cartesian.clone(cartesian);
        expect(cartesian).toBe(returnedResult);
    });

    it('getMaximumComponent works when X is greater', function() {
        var cartesian = new Cartesian3(2.0, 1.0, 0.0);
        expect(Cartesian3.getMaximumComponent(cartesian)).toEqual(cartesian.x);
    });

    it('getMaximumComponent works when Y is greater', function() {
        var cartesian = new Cartesian3(1.0, 2.0, 0.0);
        expect(Cartesian3.getMaximumComponent(cartesian)).toEqual(cartesian.y);
    });

    it('getMaximumComponent works when Z is greater', function() {
        var cartesian = new Cartesian3(1.0, 2.0, 3.0);
        expect(Cartesian3.getMaximumComponent(cartesian)).toEqual(cartesian.z);
    });

    it('getMinimumComponent works when X is lesser', function() {
        var cartesian = new Cartesian3(1.0, 2.0, 3.0);
        expect(Cartesian3.getMinimumComponent(cartesian)).toEqual(cartesian.x);
    });

    it('getMinimumComponent works when Y is lesser', function() {
        var cartesian = new Cartesian3(2.0, 1.0, 3.0);
        expect(Cartesian3.getMinimumComponent(cartesian)).toEqual(cartesian.y);
    });

    it('getMinimumComponent works when Z is lesser', function() {
        var cartesian = new Cartesian3(2.0, 1.0, 0.0);
        expect(Cartesian3.getMinimumComponent(cartesian)).toEqual(cartesian.z);
    });

    it('magnitudeSquared', function() {
        var cartesian = new Cartesian3(3.0, 4.0, 5.0);
        expect(Cartesian3.magnitudeSquared(cartesian)).toEqual(50.0);
    });

    it('magnitude', function() {
        var cartesian = new Cartesian3(3.0, 4.0, 5.0);
        expect(Cartesian3.magnitude(cartesian)).toEqual(Math.sqrt(50.0));
    });

    it('distance', function() {
        var distance = Cartesian3.distance(new Cartesian3(1.0, 0.0, 0.0), new Cartesian3(2.0, 0.0, 0.0));
        expect(distance).toEqual(1.0);
    });

    it('distance throws without left', function() {
        expect(function() {
            Cartesian3.distance();
        }).toThrow();
    });

    it('distance throws without right', function() {
        expect(function() {
            Cartesian3.distance(Cartesian3.UNIT_X);
        }).toThrow();
    });

    it('normalize works without a result parameter', function() {
        var cartesian = new Cartesian3(2.0, 0.0, 0.0);
        var expectedResult = new Cartesian3(1.0, 0.0, 0.0);
        var result = Cartesian3.normalize(cartesian);
        expect(result).toEqual(expectedResult);
    });

    it('normalize works with a result parameter', function() {
        var cartesian = new Cartesian3(2.0, 0.0, 0.0);
        var expectedResult = new Cartesian3(1.0, 0.0, 0.0);
        var result = new Cartesian3();
        var returnedResult = Cartesian3.normalize(cartesian, result);
        expect(result).toBe(returnedResult);
        expect(result).toEqual(expectedResult);
    });

    it('multiplyComponents works without a result parameter', function() {
        var left = new Cartesian3(2.0, 3.0, 6.0);
        var right = new Cartesian3(4.0, 5.0, 7.0);
        var expectedResult = new Cartesian3(8.0, 15.0, 42.0);
        var result = Cartesian3.multiplyComponents(left, right);
        expect(result).toEqual(expectedResult);
    });

    it('multiplyComponents works with a result parameter', function() {
        var left = new Cartesian3(2.0, 3.0, 6.0);
        var right = new Cartesian3(4.0, 5.0, 7.0);
        var result = new Cartesian3();
        var expectedResult = new Cartesian3(8.0, 15.0, 42.0);
        var returnedResult = Cartesian3.multiplyComponents(left, right, result);
        expect(result).toBe(returnedResult);
        expect(result).toEqual(expectedResult);
    });

    it('dot', function() {
        var left = new Cartesian3(2.0, 3.0, 6.0);
        var right = new Cartesian3(4.0, 5.0, 7.0);
        var expectedResult = 65.0;
        var result = Cartesian3.dot(left, right);
        expect(result).toEqual(expectedResult);
    });

    it('add works without a result parameter', function() {
        var left = new Cartesian3(2.0, 3.0, 6.0);
        var right = new Cartesian3(4.0, 5.0, 7.0);
        var expectedResult = new Cartesian3(6.0, 8.0, 13.0);
        var result = Cartesian3.add(left, right);
        expect(result).toEqual(expectedResult);
    });

    it('add works with a result parameter', function() {
        var left = new Cartesian3(2.0, 3.0, 6.0);
        var right = new Cartesian3(4.0, 5.0, 7.0);
        var result = new Cartesian3();
        var expectedResult = new Cartesian3(6.0, 8.0, 13.0);
        var returnedResult = Cartesian3.add(left, right, result);
        expect(returnedResult).toBe(result);
        expect(result).toEqual(expectedResult);
    });

    it('subtract works without a result parameter', function() {
        var left = new Cartesian3(2.0, 3.0, 4.0);
        var right = new Cartesian3(1.0, 5.0, 7.0);
        var expectedResult = new Cartesian3(1.0, -2.0, -3.0);
        var result = Cartesian3.subtract(left, right);
        expect(result).toEqual(expectedResult);
    });

    it('subtract works with a result parameter', function() {
        var left = new Cartesian3(2.0, 3.0, 4.0);
        var right = new Cartesian3(1.0, 5.0, 7.0);
        var result = new Cartesian3();
        var expectedResult = new Cartesian3(1.0, -2.0, -3.0);
        var returnedResult = Cartesian3.subtract(left, right, result);
        expect(returnedResult).toBe(result);
        expect(result).toEqual(expectedResult);
    });

    it('multiplyByScalar without a result parameter', function() {
        var cartesian = new Cartesian3(1.0, 2.0, 3.0);
        var scalar = 2;
        var expectedResult = new Cartesian3(2.0, 4.0, 6.0);
        var result = cartesian.multiplyByScalar(scalar);
        expect(result).toEqual(expectedResult);
    });

    it('multiplyByScalar with a result parameter', function() {
        var cartesian = new Cartesian3(1.0, 2.0, 3.0);
        var result = new Cartesian3();
        var scalar = 2;
        var expectedResult = new Cartesian3(2.0, 4.0, 6.0);
        var returnedResult = cartesian.multiplyByScalar(scalar, result);
        expect(result).toBe(returnedResult);
        expect(result).toEqual(expectedResult);
    });

    it('multiplyByScalar with "this" result parameter', function() {
        var cartesian = new Cartesian3(1.0, 2.0, 3.0);
        var scalar = 2;
        var expectedResult = new Cartesian3(2.0, 4.0, 6.0);
        var returnedResult = cartesian.multiplyByScalar(scalar, cartesian);
        expect(cartesian).toBe(returnedResult);
        expect(cartesian).toEqual(expectedResult);
    });

    it('divideByScalar without a result parameter', function() {
        var cartesian = new Cartesian3(1.0, 2.0, 3.0);
        var scalar = 2;
        var expectedResult = new Cartesian3(0.5, 1.0, 1.5);
        var result = cartesian.divideByScalar(scalar);
        expect(result).toEqual(expectedResult);
    });

    it('divideByScalar with a result parameter', function() {
        var cartesian = new Cartesian3(1.0, 2.0, 3.0);
        var result = new Cartesian3();
        var scalar = 2;
        var expectedResult = new Cartesian3(0.5, 1.0, 1.5);
        var returnedResult = cartesian.divideByScalar(scalar, result);
        expect(result).toBe(returnedResult);
        expect(result).toEqual(expectedResult);
    });

    it('divideByScalar with "this" result parameter', function() {
        var cartesian = new Cartesian3(1.0, 2.0, 3.0);
        var scalar = 2;
        var expectedResult = new Cartesian3(0.5, 1.0, 1.5);
        var returnedResult = cartesian.divideByScalar(scalar, cartesian);
        expect(cartesian).toBe(returnedResult);
        expect(cartesian).toEqual(expectedResult);
    });

    it('negate without a result parameter', function() {
        var cartesian = new Cartesian3(1.0, -2.0, -5.0);
        var expectedResult = new Cartesian3(-1.0, 2.0, 5.0);
        var result = Cartesian3.negate(cartesian);
        expect(result).toEqual(expectedResult);
    });

    it('negate with a result parameter', function() {
        var cartesian = new Cartesian3(1.0, -2.0, -5.0);
        var result = new Cartesian3();
        var expectedResult = new Cartesian3(-1.0, 2.0, 5.0);
        var returnedResult = Cartesian3.negate(cartesian, result);
        expect(result).toBe(returnedResult);
        expect(result).toEqual(expectedResult);
    });

    it('abs without a result parameter', function() {
        var cartesian = new Cartesian3(1.0, -2.0, -4.0);
        var expectedResult = new Cartesian3(1.0, 2.0, 4.0);
        var result = cartesian.abs();
        expect(result).toEqual(expectedResult);
    });

    it('abs with a result parameter', function() {
        var cartesian = new Cartesian3(1.0, -2.0, -4.0);
        var result = new Cartesian3();
        var expectedResult = new Cartesian3(1.0, 2.0, 4.0);
        var returnedResult = cartesian.abs(result);
        expect(result).toBe(returnedResult);
        expect(result).toEqual(expectedResult);
    });

    it('abs with "this" result parameter', function() {
        var cartesian = new Cartesian3(1.0, -2.0, -4.0);
        var expectedResult = new Cartesian3(1.0, 2.0, 4.0);
        var returnedResult = cartesian.abs(cartesian);
        expect(cartesian).toBe(returnedResult);
        expect(cartesian).toEqual(expectedResult);
    });

    it('lerp works without a result parameter', function() {
        var start = new Cartesian3(4.0, 8.0, 10.0);
        var end = new Cartesian3(8.0, 20.0, 20.0);
        var t = 0.25;
        var expectedResult = new Cartesian3(5.0, 11.0, 12.5);
        var result = start.lerp(end, t);
        expect(result).toEqual(expectedResult);
    });

    it('lerp works with a result parameter', function() {
        var start = new Cartesian3(4.0, 8.0, 10.0);
        var end = new Cartesian3(8.0, 20.0, 20.0);
        var t = 0.25;
        var result = new Cartesian3();
        var expectedResult = new Cartesian3(5.0, 11.0, 12.5);
        var returnedResult = start.lerp(end, t, result);
        expect(result).toBe(returnedResult);
        expect(result).toEqual(expectedResult);
    });

    it('lerp works with "this" result parameter', function() {
        var start = new Cartesian3(4.0, 8.0, 10.0);
        var end = new Cartesian3(8.0, 20.0, 20.0);
        var t = 0.25;
        var expectedResult = new Cartesian3(5.0, 11.0, 12.5);
        var returnedResult = start.lerp(end, t, start);
        expect(start).toBe(returnedResult);
        expect(start).toEqual(expectedResult);
    });

    it('lerp extrapolate forward', function() {
        var start = new Cartesian3(4.0, 8.0, 10.0);
        var end = new Cartesian3(8.0, 20.0, 20.0);
        var t = 2.0;
        var expectedResult = new Cartesian3(12.0, 32.0, 30.0);
        var result = start.lerp(end, t);
        expect(result).toEqual(expectedResult);
    });

    it('lerp extrapolate backward', function() {
        var start = new Cartesian3(4.0, 8.0, 10.0);
        var end = new Cartesian3(8.0, 20.0, 20.0);
        var t = -1.0;
        var expectedResult = new Cartesian3(0.0, -4.0, 0.0);
        var result = start.lerp(end, t);
        expect(result).toEqual(expectedResult);
    });

    it('angleBetween works for right angles', function() {
        var x = Cartesian3.UNIT_X;
        var y = Cartesian3.UNIT_Y;
        expect(x.angleBetween(y)).toEqual(CesiumMath.PI_OVER_TWO);
        expect(y.angleBetween(x)).toEqual(CesiumMath.PI_OVER_TWO);
    });

    it('angleBetween works for acute angles', function() {
        var x = new Cartesian3(0.0, 1.0, 0.0);
        var y = new Cartesian3(1.0, 1.0, 0.0);
        expect(x.angleBetween(y)).toEqualEpsilon(CesiumMath.PI_OVER_FOUR, CesiumMath.EPSILON14);
        expect(y.angleBetween(x)).toEqualEpsilon(CesiumMath.PI_OVER_FOUR, CesiumMath.EPSILON14);
    });

    it('angleBetween works for obtuse angles', function() {
        var x = new Cartesian3(0.0, 1.0, 0.0);
        var y = new Cartesian3(0.0, -1.0, -1.0);
        expect(x.angleBetween(y)).toEqualEpsilon(CesiumMath.PI * 3.0 / 4.0, CesiumMath.EPSILON14);
        expect(y.angleBetween(x)).toEqualEpsilon(CesiumMath.PI * 3.0 / 4.0, CesiumMath.EPSILON14);
    });

    it('angleBetween works for zero angles', function() {
        var x = Cartesian3.UNIT_X;
        expect(x.angleBetween(x)).toEqual(0.0);
    });

    it('most orthogonal angle is x', function() {
        var v = new Cartesian3(0.0, 1.0, 2.0);
        expect(v.mostOrthogonalAxis()).toEqual(Cartesian3.UNIT_X);
    });

    it('most orthogonal angle is y', function() {
        var v = new Cartesian3(1.0, 0.0, 2.0);
        expect(v.mostOrthogonalAxis()).toEqual(Cartesian3.UNIT_Y);
    });

    it('most orthogonal angle is z', function() {
        var v = new Cartesian3(1.0, 3.0, 0.0);
        expect(v.mostOrthogonalAxis()).toEqual(Cartesian3.UNIT_Z);

        v = new Cartesian3(3.0, 1.0, 0.0);
        expect(v.mostOrthogonalAxis()).toEqual(Cartesian3.UNIT_Z);
    });

    it('equals', function() {
        var cartesian = new Cartesian3(1.0, 2.0, 3.0);
        expect(cartesian.equals(new Cartesian3(1.0, 2.0, 3.0))).toEqual(true);
        expect(cartesian.equals(new Cartesian3(2.0, 2.0, 3.0))).toEqual(false);
        expect(cartesian.equals(new Cartesian3(2.0, 1.0, 3.0))).toEqual(false);
        expect(cartesian.equals(new Cartesian3(1.0, 2.0, 4.0))).toEqual(false);
        expect(cartesian.equals(undefined)).toEqual(false);
    });

    it('equalsEpsilon', function() {
        var cartesian = new Cartesian3(1.0, 2.0, 3.0);
        expect(Cartesian3.equalsEpsilon(cartesian, new Cartesian3(1.0, 2.0, 3.0), 0.0)).toEqual(true);
        expect(Cartesian3.equalsEpsilon(cartesian, new Cartesian3(1.0, 2.0, 3.0), 1.0)).toEqual(true);
        expect(Cartesian3.equalsEpsilon(cartesian, new Cartesian3(2.0, 2.0, 3.0), 1.0)).toEqual(true);
        expect(Cartesian3.equalsEpsilon(cartesian, new Cartesian3(1.0, 3.0, 3.0), 1.0)).toEqual(true);
        expect(Cartesian3.equalsEpsilon(cartesian, new Cartesian3(1.0, 2.0, 4.0), 1.0)).toEqual(true);
        expect(Cartesian3.equalsEpsilon(cartesian, new Cartesian3(2.0, 2.0, 3.0), 0.99999)).toEqual(false);
        expect(Cartesian3.equalsEpsilon(cartesian, new Cartesian3(1.0, 3.0, 3.0), 0.99999)).toEqual(false);
        expect(Cartesian3.equalsEpsilon(cartesian, new Cartesian3(1.0, 2.0, 4.0), 0.99999)).toEqual(false);
        expect(Cartesian3.equalsEpsilon(cartesian, undefined, 1)).toEqual(false);
    });

    it('toString', function() {
        var cartesian = new Cartesian3(1.123, 2.345, 6.789);
        expect(cartesian.toString()).toEqual('(1.123, 2.345, 6.789)');
    });

    it('cross works without a result parameter', function() {
        var left = new Cartesian3(1, 2, 5);
        var right = new Cartesian3(4, 3, 6);
        var expectedResult = new Cartesian3(-3, 14, -5);
        var returnedResult = left.cross(right);
        expect(returnedResult).toEqual(expectedResult);
    });

    it('cross works with a result parameter', function() {
        var left = new Cartesian3(1, 2, 5);
        var right = new Cartesian3(4, 3, 6);
        var result = new Cartesian3();
        var expectedResult = new Cartesian3(-3, 14, -5);
        var returnedResult = left.cross(right, result);
        expect(returnedResult).toBe(result);
        expect(result).toEqual(expectedResult);
    });

    it('cross works with "this" result parameter', function() {
        var left = new Cartesian3(1, 2, 5);
        var right = new Cartesian3(4, 3, 6);
        var expectedResult = new Cartesian3(-3, 14, -5);
        var returnedResult = left.cross(right, left);
        expect(returnedResult).toBe(left);
        expect(left).toEqual(expectedResult);
    });

    it('fromSpherical throws with no spherical parameter', function() {
        expect(function() {
            Cartesian3.fromSpherical(undefined);
        }).toThrow();
    });


    it('static clone returns undefined with no parameter', function() {
        expect(Cartesian3.clone()).toBeUndefined();
    });

    it('static getMaximumComponent throws with no parameter', function() {
        expect(function() {
            Cartesian3.getMaximumComponent();
        }).toThrow();
    });

    it('static getMinimumComponent throws with no parameter', function() {
        expect(function() {
            Cartesian3.getMinimumComponent();
        }).toThrow();
    });

    it('static magnitudeSquared throws with no parameter', function() {
        expect(function() {
            Cartesian3.magnitudeSquared();
        }).toThrow();
    });

    it('static magnitude throws with no parameter', function() {
        expect(function() {
            Cartesian3.magnitude();
        }).toThrow();
    });

    it('static normalize throws with no parameter', function() {
        expect(function() {
            Cartesian3.normalize();
        }).toThrow();
    });

    it('static dot throws with no left parameter', function() {
        expect(function() {
            Cartesian3.dot(undefined, new Cartesian3());
        }).toThrow();
    });

    it('static multiplyComponents throw with no left parameter', function() {
        var right = new Cartesian3(4.0, 5.0, 6.0);
        expect(function() {
            Cartesian3.multiplyComponents(undefined, right);
        }).toThrow();
    });

    it('static multiplyComponents throw with no right parameter', function() {
        var left = new Cartesian3(4.0, 5.0, 6.0);
        expect(function() {
            Cartesian3.multiplyComponents(left, undefined);
        }).toThrow();
    });

    it('static dot throws with no right parameter', function() {
        expect(function() {
            Cartesian3.dot(new Cartesian3(), undefined);
        }).toThrow();
    });

    it('static add throws with no left parameter', function() {
        expect(function() {
            Cartesian3.add(undefined, new Cartesian3());
        }).toThrow();
    });

    it('static add throws with no right parameter', function() {
        expect(function() {
            Cartesian3.add(new Cartesian3(), undefined);
        }).toThrow();
    });

    it('static subtract throws with no left parameter', function() {
        expect(function() {
            Cartesian3.subtract(undefined, new Cartesian3());
        }).toThrow();
    });

    it('static subtract throws with no right parameter', function() {
        expect(function() {
            Cartesian3.subtract(new Cartesian3(), undefined);
        }).toThrow();
    });

    it('static multiplyByScalar throws with no cartesian parameter', function() {
        expect(function() {
            Cartesian3.multiplyByScalar(undefined, 2.0);
        }).toThrow();
    });

    it('static multiplyByScalar throws with no scalar parameter', function() {
        expect(function() {
            Cartesian3.multiplyByScalar(new Cartesian3(), undefined);
        }).toThrow();
    });

    it('static divideByScalar throws with no cartesian parameter', function() {
        expect(function() {
            Cartesian3.divideByScalar(undefined, 2.0);
        }).toThrow();
    });

    it('static divideByScalar throws with no scalar parameter', function() {
        expect(function() {
            Cartesian3.divideByScalar(new Cartesian3(), undefined);
        }).toThrow();
    });

    it('static negate throws with no cartesian parameter', function() {
        expect(function() {
            Cartesian3.negate(undefined);
        }).toThrow();
    });

    it('static abs throws with no cartesian parameter', function() {
        expect(function() {
            Cartesian3.abs(undefined);
        }).toThrow();
    });

    it('static lerp throws with no start parameter', function() {
        var end = new Cartesian3(8.0, 20.0, 6.0);
        var t = 0.25;
        expect(function() {
            Cartesian3.lerp(undefined, end, t);
        }).toThrow();
    });

    it('static lerp throws with no end parameter', function() {
        var start = new Cartesian3(4.0, 8.0, 6.0);
        var t = 0.25;
        expect(function() {
            Cartesian3.lerp(start, undefined, t);
        }).toThrow();
    });

    it('static lerp throws with no t parameter', function() {
        var start = new Cartesian3(4.0, 8.0, 6.0);
        var end = new Cartesian3(8.0, 20.0, 6.0);
        expect(function() {
            Cartesian3.lerp(start, end, undefined);
        }).toThrow();
    });

    it('static angleBetween throws with no left parameter', function() {
        var right = new Cartesian3(8.0, 20.0, 6.0);
        expect(function() {
            Cartesian3.angleBetween(undefined, right);
        }).toThrow();
    });

    it('static angleBetween throws with no right parameter', function() {
        var left = new Cartesian3(4.0, 8.0, 6.0);
        expect(function() {
            Cartesian3.angleBetween(left, undefined);
        }).toThrow();
    });

    it('static mostOrthogonalAxis throws with no cartesian parameter', function() {
        expect(function() {
            Cartesian3.mostOrthogonalAxis(undefined);
        }).toThrow();
    });

    it('static equalsEpsilon throws with no epsilon', function() {
        expect(function() {
            Cartesian3.equalsEpsilon(new Cartesian3(), new Cartesian3(), undefined);
        }).toThrow();
    });

    it('static cross throw with no left paramater', function() {
        var right = new Cartesian3(4, 3, 6);
        expect(function() {
            Cartesian3.cross(undefined, right);
        }).toThrow();
    });

    it('static cross throw with no left paramater', function() {
        var left = new Cartesian3(1, 2, 5);
        expect(function() {
            Cartesian3.cross(left, undefined);
        }).toThrow();
    });

    it('fromElements returns a cartesian3 with corrrect coordinates', function(){
        var cartesian2 = Cartesian3.fromElements(2, 2, 4);
        var expectedResult = new Cartesian3(2, 2, 4);
        expect(cartesian2).toEqual(expectedResult);
    });

    it('fromElements result param returns cartesian3 with correct coordinates', function(){
        var cartesian3 = new Cartesian3();
        Cartesian3.fromElements(2, 2, 4, cartesian3);
        var expectedResult = new Cartesian3(2, 2, 4);
        expect(cartesian3).toEqual(expectedResult);
    });

    createPackableSpecs(Cartesian3, new Cartesian3(1, 2, 3), [1, 2, 3]);
});
