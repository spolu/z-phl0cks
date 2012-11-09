var util = require('util'); 

var my = {};

/**
 * --------------
 * Initialization
 * --------------
 *
 *  The `init` function is called with the number of ships active per
 *  phl0cks in this game. The `init` function is a good place to
 *  initialize your data structure and prepare everything for the
 *  first call to control. Any global variable defined here will be
 *  preserved and accessible by the control function at each control
 *  phase.
 *
 * @param size number of ships per phl0ck
 * @param spec specifications of the simulated world
 */
exports.init = function(size, spec) {
  my.spec = spec;
  my.size = size;
};


var dist = function(v1, v2) {
  return Math.sqrt((v1.x - v2.x) * (v1.x - v2.x) +
                   (v1.y - v2.y) * (v1.y - v2.y));
};

var scalar = function(v1, v2) {
  return v1.x * v2.x + v1.y + v2.y;
}

var norm = function(v) {
  return Math.sqrt(scalar(v,v));
}

var angle = function(v1, v2) {
  return Math.acos(scalar(v1, v2) / (norm(v1) * norm(v2)));
};

/**
 * -------
 * Control
 * -------
 */
exports.control = function(step, t, ship, ships, missiles) {
  var theta = undefined;
  var sigma = undefined;
  
  var min = my.spec.HALFSIZE * 2;
  var evict = null;
  missiles.forEach(function(m) {
    var d = dist(m.state.p, ship.state.p);
    if(d < min && m.desc.owner !== ship.desc.owner) {
      min = d;
      evict = m;
    }
  });

  if(evict) {
    theta = azimut(evict) + Math.PI;
  }

  min = my.spec.HALFSIZE * 2;
  var target = null;
  ships.forEach(function(s) {
    var d = dist(s.state.p, ship.state.p);
    if(d < min && s.desc.owner !== ship.desc.owner) {
      util.debug(s.desc.owner + ' ' + ship.desc.owner);
      min = d;
      target = s;
    }
  });

  if(target) {
    sigma = angle(ship.state.p, target.state.p);
  }

  return { 
    theta: theta,
    sigma: sigma
  };
};

