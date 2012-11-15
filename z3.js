var util = require('util'); 

/**
 * -------
 * Helpers
 * -------
 */
var dist = function(v1, v2) {
  return Math.sqrt((v1.x - v2.x) * (v1.x - v2.x) +
                   (v1.y - v2.y) * (v1.y - v2.y));
};

var scalar = function(v1, v2) {
  return v1.x * v2.x + v1.y * v2.y;
}

var norm = function(v) {
  return Math.sqrt(scalar(v,v));
}

var angle = function(v1, v2) {
  return Math.acos(scalar(v1, v2) / (norm(v1) * norm(v2)));
};

var azimut = function(ship, target) {
  var v = { 
    x: target.state.p.x - ship.state.p.x,
    y: target.state.p.y - ship.state.p.y
  };
  var t = angle({ x: 1, y: 0 }, v);
  if(v.y > 0) return t;
  else return -t;
};

var add = function(v1, v2) {
  return { 
    x: v1.x + v2.x,
    y: v1.y + v2.y
  };
};

var div = function(v, s) {
  return {
    x: v.x / s,
    y: v.y / s
  };
};

var sub = function(v1, v2) {
  return {
    x: v1.x - v2.x,
    y: v1.y - v2.y
  };
}


/**
 * --------------
 * Initialization
 * --------------
 */
var my = {};

exports.init = function(size, spec) {
  my.spec = spec;
  my.size = size;
  //
  // Your Implementation [use util.debug for console debbuging]
  //
  return;
};

/**
 * -------
 * Control
 * -------
 */
exports.control = function(step, t, ship, ships, missiles) {
  var theta = undefined;
  var sigma = undefined;

  /*
   * COHESION
   */
  var sum = { x: 0, y: 0 };
  var sum_count = 0;
  ships.forEach(function(s) {
    var d = dist(s.state.p, ship.state.p);
    if(s.desc.id !== ship.desc.id && s.desc.owner === ship.desc.owner && d > 0) {
      sum = add(sum, s.state.p);
      sum_count++;
    }
  });
  var cohesion = { x: 0, y: 0 };
  if(sum_count > 0) {
    var desired = sub(div(sum, sum_count), ship.state.p);
    var n = norm(desired);
    
    if(n > 0) {
      div(desired, n / my.spec.MAX_VELOCITY);
      cohesion = sub(desired, ship.state.v);
      util.debug('COHESION: ' + cohesion.x + ' ' + cohesion.y);
    }
  }

  /*
   * SEPARATION
   */
  var mean = { x: 0, y: 0 };
  var mean_count = 0;
  ships.forEach(function(s) {
    var d = dist(s.state.p, ship.state.p);
    if(s.desc.id !== ship.desc.id && s.desc.owner === ship.desc.owner && d < 500) {
      var v = sub(ship.state.p, s.state.p);
      var n = norm(v);
      mean = add(mean, div(v, n * d));
      mean_count ++;
    }
  });
  var separation = { x: 0, y: 0 };
  if(mean_count > 0) {
    separation = div(mean, mean_count);
    util.debug('SEPARATION: ' + separation.x + ' ' + separation.y);
  }

  /*
   * TRACKING
   */
  var center = { x: 0, y: 0 };
  var center_count = 0;
  ships.forEach(function(s) {
    if(s.desc.owner === ship.desc.owner) {
      util.debug('P: ' + s.state.p.x + ' ' + s.state.p.y);
      center = add(center, s.state.p);
      center_count++;
    }
  });
  center = div(center, center_count);
  util.debug('CENTER: ' + center.x + ' ' + center.y);
  var closest = undefined;
  var min = my.spec.HALFSIZE * 2;
  ships.forEach(function(s) {
    var d = dist(s.state.p, center);
    if(d < min && s.desc.owner !== ship.desc.owner) {
      min = d;
      closest = s.state.p;
    }
  });
  var tracking = { x: 0, y: 0 };
  if(closest) {
    var dir = sub(closest, ship.state.p);
    var n = norm(dir);
    tracking = div(dir, n / my.spec.MAX_VELOCITY);
    util.debug('TRACKING: ' + tracking.x + ' ' + tracking.y);
  }

  var steer = { x: 0, y: 0 };
  steer = add(steer, div(cohesion, 4/3));
  steer = add(steer, div(separation, 4));
  steer = add(steer, div(tracking, 2));

  var n = norm(steer);

  if(n > 0) {
    theta = angle({ x: 1, y: 0 }, steer);
    if(steer.y < 0) theta = -theta;
  }

  return { 
    theta: theta,
    sigma: Math.random() * 2 * Math.PI
  };
};

