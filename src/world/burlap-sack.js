// Saco de arpillera de pocos polígonos, con cuello plegado y cordel oscuro.
export function createBurlapSack(THREE) {
    const contour = [
        [0, 0], [0.27, 0.015], [0.39, 0.13], [0.43, 0.37],
        [0.38, 0.63], [0.28, 0.78], [0.15, 0.84],
        [0.12, 0.94], [0.16, 1.02], [0, 1.06]
    ];
    const geometry = new THREE.LatheGeometry(
        contour.map(([radius, height]) => new THREE.Vector2(radius, height)), 8
    );
    geometry.computeBoundingBox();
    const sack = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
        color: 0x837052, shininess: 0, flatShading: true
    }));
    const cord = new THREE.Mesh(
        new THREE.TorusGeometry(0.13, 0.025, 3, 8),
        new THREE.MeshPhongMaterial({ color: 0x50402d, shininess: 0, flatShading: true })
    );
    cord.rotation.x = Math.PI / 2;
    cord.position.y = 0.9;
    sack.add(cord);
    return sack;
}
