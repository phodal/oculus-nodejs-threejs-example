if ( ! Detector.webgl ) {
    Detector.addGetWebGLMessage();
    document.getElementById( 'container' ).innerHTML = "";
}
var container, stats, effect, oculusControl;
var camera, scene, renderer;
var mesh;
var worldWidth = 128, worldDepth = 128,
    worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2,
    data = generateHeight( worldWidth, worldDepth );
var clock = new THREE.Clock();

init();
animate();

function init() {
    container = document.getElementById( 'container' );

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 20000 );
    camera.position.y = getY( worldHalfWidth, worldHalfDepth ) * 100 + 100;

    oculusControl = new THREE.DK2Controls( camera );

    scene = new THREE.Scene();
    // sides
    var matrix = new THREE.Matrix4();
    var pxGeometry = new THREE.PlaneBufferGeometry( 100, 100 );
    pxGeometry.attributes.uv.array[ 1 ] = 0.5;
    pxGeometry.attributes.uv.array[ 3 ] = 0.5;
    pxGeometry.rotateY( Math.PI / 2 );
    pxGeometry.translate( 50, 0, 0 );

    var nxGeometry = new THREE.PlaneBufferGeometry( 100, 100 );
    nxGeometry.attributes.uv.array[ 1 ] = 0.5;
    nxGeometry.attributes.uv.array[ 3 ] = 0.5;
    nxGeometry.rotateY( - Math.PI / 2 );
    nxGeometry.translate( - 50, 0, 0 );

    var pyGeometry = new THREE.PlaneBufferGeometry( 100, 100 );
    pyGeometry.attributes.uv.array[ 5 ] = 0.5;
    pyGeometry.attributes.uv.array[ 7 ] = 0.5;
    pyGeometry.rotateX( - Math.PI / 2 );
    pyGeometry.translate( 0, 50, 0 );

    var pzGeometry = new THREE.PlaneBufferGeometry( 100, 100 );
    pzGeometry.attributes.uv.array[ 1 ] = 0.5;
    pzGeometry.attributes.uv.array[ 3 ] = 0.5;
    pzGeometry.translate( 0, 0, 50 );

    var nzGeometry = new THREE.PlaneBufferGeometry( 100, 100 );
    nzGeometry.attributes.uv.array[ 1 ] = 0.5;
    nzGeometry.attributes.uv.array[ 3 ] = 0.5;
    nzGeometry.rotateY( Math.PI );
    nzGeometry.translate( 0, 0, -50 );
    //
    // BufferGeometry cannot be merged yet.
    var tmpGeometry = new THREE.Geometry();
    var pxTmpGeometry = new THREE.Geometry().fromBufferGeometry( pxGeometry );
    var nxTmpGeometry = new THREE.Geometry().fromBufferGeometry( nxGeometry );
    var pyTmpGeometry = new THREE.Geometry().fromBufferGeometry( pyGeometry );
    var pzTmpGeometry = new THREE.Geometry().fromBufferGeometry( pzGeometry );
    var nzTmpGeometry = new THREE.Geometry().fromBufferGeometry( nzGeometry );
    for ( var z = 0; z < worldDepth; z ++ ) {
        for ( var x = 0; x < worldWidth; x ++ ) {
            var h = getY( x, z );
            matrix.makeTranslation(
                x * 100 - worldHalfWidth * 100,
                h * 100,
                z * 100 - worldHalfDepth * 100
            );
            var px = getY( x + 1, z );
            var nx = getY( x - 1, z );
            var pz = getY( x, z + 1 );
            var nz = getY( x, z - 1 );
            tmpGeometry.merge( pyTmpGeometry, matrix );
            if ( ( px !== h && px !== h + 1 ) || x === 0 ) {
                tmpGeometry.merge( pxTmpGeometry, matrix );
            }
            if ( ( nx !== h && nx !== h + 1 ) || x === worldWidth - 1 ) {
                tmpGeometry.merge( nxTmpGeometry, matrix );
            }
            if ( ( pz !== h && pz !== h + 1 ) || z === worldDepth - 1 ) {
                tmpGeometry.merge( pzTmpGeometry, matrix );
            }
            if ( ( nz !== h && nz !== h + 1 ) || z === 0 ) {
                tmpGeometry.merge( nzTmpGeometry, matrix );
            }
        }
    }

    var geometry = new THREE.BufferGeometry().fromGeometry( tmpGeometry );
    geometry.computeBoundingSphere();

    var texture = THREE.ImageUtils.loadTexture( './js/textures/minecraft/atlas.png' );
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.LinearMipMapLinearFilter;

    var mesh = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { map: texture } ) );
    scene.add( mesh );
    var ambientLight = new THREE.AmbientLight( 0xcccccc );
    scene.add( ambientLight );
    var directionalLight = new THREE.DirectionalLight( 0xffffff, 2 );
    directionalLight.position.set( 1, 1, 0.5 ).normalize();
    scene.add( directionalLight );

    scene.add( dae );

    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor( 0xbfd1e5 );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    effect = new THREE.OculusRiftEffect(renderer, { worldScale: 100 });
    effect.setSize(window.innerWidth, window.innerHeight);

    container.innerHTML = "";
    container.appendChild( renderer.domElement );
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    container.appendChild( stats.domElement );
    //
    window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    effect.setSize(window.innerWidth, window.innerHeight);
}

function generateHeight( width, height ) {
    var data = [], perlin = new ImprovedNoise(),
        size = width * height, quality = 2, z = Math.random() * 100;
    for ( var j = 0; j < 4; j ++ ) {
        if ( j === 0 ) for ( var i = 0; i < size; i ++ ) data[ i ] = 0;
        for ( var i = 0; i < size; i ++ ) {
            var x = i % width, y = ( i / width ) | 0;
            data[ i ] += perlin.noise( x / quality, y / quality, z ) * quality;
        }
        quality *= 4;
    }
    return data;
}
function getY( x, z ) {
    return ( data[ x + z * worldWidth ] * 0.2 ) | 0;
}
//
function animate() {
    requestAnimationFrame( animate );
    render();
    stats.update();
}
function render() {
    oculusControl.update( clock.getDelta() );
    THREE.AnimationHandler.update( clock.getDelta() * 100 );

    camera.useQuaternion = true;
    camera.matrixWorldNeedsUpdate = true;

    effect.render(scene, camera);
}