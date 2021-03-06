(function() {
  var THREE       = require('three');
  var delaunay    = require('./../src/delaunay.js');
  var screenSize  = function() { return 20; };
  var screenWidth = screenSize();
  var rendererHeight = 1, rendererWidth = 1;

  var scene, camera, renederer;
  (function() {
    var w = window.innerWidth - 4,
        h = window.innerHeight - 4;
    var aspect = w / h;
    var sw = screenSize() * aspect;
    var sh = screenSize();

    scene    = new THREE.Scene();
    camera   = new THREE.OrthographicCamera(sw / -2, sw / 2, sh / 2, sh / -2, 1, -1);
    renderer = new THREE.WebGLRenderer({ antialias : true });
    renderer.setSize(w, h);
    document.body.appendChild(renderer.domElement);

    var resize = function() {
      var w = window.innerWidth - 4,
          h = window.innerHeight - 4;
      var aspect = w / h;
      var sw = screenSize() * aspect,
          sh = screenSize();

      camera.left = -sw / 2; camera.right  = sw / 2;
      camera.top  = sh / 2;  camera.bottom = sh / -2;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);

      screenWidth = sw;
      rendererWidth = w;
      rendererHeight = h;
    };
    resize();

    window.onresize = (function() {
      var timestamp = 0;
      return function() {
        clearTimeout(timestamp);
        timestamp = setTimeout(resize, 200);
      };
    }());
  }());

  var rawGeometry = delaunay.createDelaunay(screenSize()*4);
  var material    = new THREE.MeshBasicMaterial({
    wireframe          : true,
    wireframeLinewidth : 2
  });

  var meshFromRawGeometry = function(rawGeometry) {
    var geometry    = new THREE.Geometry();
    rawGeometry.points.forEach(function(point) {
      geometry.vertices.push(new THREE.Vector3(point[0], point[1], 0));
    });

    var isEdgePiece = function(a) { return a === 0 || a === 1 || a === 2; };

    rawGeometry.triangles.forEach(function(triangle) {
      var p = triangle.getPoints();
      if (isEdgePiece(p[0]) || isEdgePiece(p[1]) || isEdgePiece(p[2])) {
        return;
      }
      geometry.faces.push(new THREE.Face3(p[0], p[1], p[2]));
    });

    return new THREE.Mesh(geometry, material);
  };

  var uniqueEdges = delaunay.trimEdges(rawGeometry, [-3, -3]);
  delaunay.finalizeTriangulation(rawGeometry, uniqueEdges, [-3, -3]);

  uniqueEdges = delaunay.trimEdges(rawGeometry, [3, -3]);
  delaunay.finalizeTriangulation(rawGeometry, uniqueEdges, [3, -3]);

  uniqueEdges = delaunay.trimEdges(rawGeometry, [0, 3]);
  delaunay.finalizeTriangulation(rawGeometry, uniqueEdges, [0, 3]);

  var delaunayMesh = meshFromRawGeometry(rawGeometry);

  scene.add(delaunayMesh);
  // scene.remove(delaunayMesh);

  document.getElementsByTagName('canvas')[0].onclick = function(event) {
    var x = (event.x / rendererWidth - 0.5) * screenWidth;
    var y = (0.5 - event.y / rendererHeight) * screenSize();

    var edges = delaunay.trimEdges(rawGeometry, [x, y]);
    delaunay.finalizeTriangulation(rawGeometry, edges, [x, y]);

    scene.remove(delaunayMesh);
    delaunayMesh = meshFromRawGeometry(rawGeometry);
    scene.add(delaunayMesh);
  };

  var update = function() {
    renderer.render(scene, camera);

    requestAnimationFrame(update);
  };
  update();
}());




