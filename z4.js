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
};

var steer = function(ship, target) {
  var d = sub(target, ship.state.v);
  var n = norm(d);
  var theta = undefined;
  if(n > 0) {
    theta = angle({ x: 1, y: 0 }, d);
    if(d.y < 0) theta = -theta;
  }
  return theta;
};

/**
 * --------------
 * Initialization
 * --------------
 */
var my = {};

exports.init = function(size, spec) {
  my.spec = spec;
  my.size = size;

  //util.debug(util.inspect(my.spec));
};

/*
 * COHESION
 */
var cohesion = function(ship, ships) {
  var sum = { x: 0, y: 0 };
  var sum_count = 0;
  ships.forEach(function(s) {
    var d = dist(s.state.p, ship.state.p);
    if(s.desc.owner === ship.desc.owner && d > 0) {
      sum = add(sum, s.state.p);
      sum_count++;
    }
  });
  var cohesion = { x: 0, y: 0 };
  if(sum_count > 0) {
    var desired = sub(div(sum, sum_count), ship.state.p);
    var n = norm(desired);
    if(n > 0) {
      cohesion = div(desired, n);
      //util.debug('COHESION: ' + cohesion.x + ' ' + cohesion.y);
    }
  }
  return cohesion;
};

/*
 * SEPARATION
 */
var separation = function(ship, ships, missiles) {
  var closest = undefined;
  var max = 200;
  var separation = { x: 0, y: 0 };
  ships.forEach(function(s) {
    if(s.desc.id !== ship.desc.id) {
      var r = sub(ship.state.p, s.state.p);
      var dr = sub(ship.state.v, s.state.v);
      var d = dist(s.state.p, ship.state.p);
      if(d < max && scalar(r,dr) < 0) {
        separation = add(separation, div(r, d*d));
      }
    }
  });
  max = 400;
  missiles.forEach(function(m) {
    if(m.desc.owner !== ship.desc.owner) {
      var r = sub(ship.state.p, m.state.p);
      var dr = sub(ship.state.v, m.state.v);
      var d = dist(m.state.p, ship.state.p);
      if(d < max && scalar(r,dr) < 0) {
        separation = add(separation, div(r, d*d));
      }
    }
  });
  return separation;
};


/*
 * ALIGNMENT
 */
var alignment = function(ship, ships) {
  var dir = { x: 0, y: 0 };
  var dir_count = 0;
  ships.forEach(function(s) {
    var d = dist(s.state.p, ship.state.p);
    if(s.desc.id !== ship.desc.id && s.desc.owner === ship.desc.owner && d > 0) {
      dir = add(dir, s.state.v);
      dir_count++;
    }
  });
  var alignment = { x: 0, y: 0 }
  if(dir_count > 0) {
    var n = norm(dir);
    alignment = div(dir, n);
    //util.debug('ALIGNMENT: ' + alignment.x + ' ' + alignment.y);
  }
  return alignment;
};

/*
 * CENTER
 */
var center = function(ship, ships) {
  var center = { x: 0, y: 0 };
  var center_count = 0;
  ships.forEach(function(s) {
    if(s.desc.owner === ship.desc.owner) {
      center = add(center, s.state.p);
      center_count++;
    }
  });
  //util.debug('CENTER: ' + center.x + ' ' + center.y);
  return div(center, center_count);
};

/**
 * AIM
 */
var aim = function(ship, target) {
  var r = sub(target.state.p, ship.state.p);
  var dr = sub(target.state.v, ship.state.v);
  var V = my.spec.MISSILE_VELOCITY;
  
  var a = Math.pow(norm(dr),2) - Math.pow(V,2);
  var b = 2 * scalar(r,dr);
  var c = Math.pow(norm(r),2);

  /*
  util.debug('norm(dr)^2: ' + Math.pow(norm(dr),2));
  util.debug('-V^2: ' + (-Math.pow(V,2)));
  util.debug('norm(r): ' + (norm(r)));
  util.debug('b: ' + b);
  util.debug('a: ' + a);
  util.debug('c: ' + c);
  */

  var delta = Math.pow(b,2) - 4*a*c;
  if(delta < 0) return null;
  var ta = (-b - Math.sqrt(delta)) / (2*a);
  var tb = (-b + Math.sqrt(delta)) / (2*a);

  var t;
  if(ta < 0 && tb < 0) return null;
  if(ta < 0 && tb > 0) t = tb;
  if(ta > 0 && tb < 0) t = ta;
  if(ta > 0 && tb > 0) t = Math.min(ta, tb);

  var theta = Math.acos((r.x + dr.x * t) / (V*t));
  if((r.y + dr.y * t) < 0) theta = -theta;

  return theta;
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
   * AIMING
   */
  var ctr = center(ship, ships);
  var closest = undefined;
  var min = my.spec.HALFSIZE * 2;
  if(ship.state.missiles > 3) {
    my.blast = true;
  }
  else if(my.blast && ship.state.missiles === 0) {
    my.blast = false;
  }
  if(my.blast) {
    ships.forEach(function(s) {
      var d = dist(s.state.p, ctr);
      if(d < min && s.desc.owner !== ship.desc.owner) {
        sigma = aim(ship, s) || sigma;
        min = d;
      }
    });
    if(sigma) {
      var delta = (0.5 - Math.random()) * Math.PI/18;
      sigma += delta;
    }
  }

  var sep = separation(ship, ships, missiles);
  if(norm(sep) > 0) {
    theta = steer(ship, div(sep, norm(sep) / my.spec.MAX_VELOCITY));
  }
  else {
    var st = { x: 0, y: 0 };
    st = add(st, div(cohesion(ship, ships), 10/4));
    st = add(st, div(alignment(ship, ships), 10/6));
    var n = norm(st);
    if(n > 0) {
      st = div(st, n * 4 / my.spec.MAX_VELOCITY);
      theta = steer(ship, st);
    }
  }

  return { 
    theta: theta,
    sigma: sigma
  };
};

