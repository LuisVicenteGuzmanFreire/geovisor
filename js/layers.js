const agregarControlDibujo = () => {
    map.pm.addControls({
        position: 'topleft',
        drawMarker: true,
        drawPolyline: true,
        drawPolygon: true,
        drawRectangle: true,
        drawCircle: true,
        editMode: true,
        dragMode: true,
        cutPolygon: true,
        removalMode: true
    });
};
