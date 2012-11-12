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


/**
 * --------------
 * Initialization
 * --------------
 */
var my = {};

exports.init = function(size, spec) {
  my.spec = spec;
  my.size = size;
};


/**
 * -------
 * Control
 * -------
 */
exports.control = function(step, t, ship, ships, missiles) {
  var theta = undefined;
  var sigma = undefined;
  

  var min = my.spec.HALFSIZE / 2;
  var evict = null;
  missiles.forEach(function(m) {
    var d = dist(m.state.p, ship.state.p);
    if(d < min && m.desc.owner !== ship.desc.owner) {
      min = d;
      evict = m;
    }
  });
  ships.forEach(function(s) {
    var d = dist(s.state.p, ship.state.p);
    if(d < min) {
      min = d;
      evict = s;
    }
  });

  if(evict) {
    var a = angle(ship.state.p, evict.state.p);
    theta = a + 3 * Math.PI / 4;
    if(scalar(ship.state.v, { x: Math.cos(theta), y: Math.sin(theta) }) > my.spec.MAX_VELOCITY / 4) {
      theta = a - 3 * Math.PI / 4;
    }
  }

  min = my.spec.HALFSIZE * 2;
  var target = null;
  ships.forEach(function(s) {
    var d = dist(s.state.p, ship.state.p);
    if(d < min && s.desc.owner !== ship.desc.owner) {
      min = d;
      target = s;
    }
  });

  if(target) {
    sigma = azimut(ship, target);
  }

  return { 
    theta: theta,
    sigma: sigma
  };
};

