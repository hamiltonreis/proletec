function initMap() {
    const myLatLng = { lat: -7.119433, lng: -34.845013 }; // Coordenadas de João Pessoa
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 12,
        center: myLatLng,
    });

    new google.maps.Marker({
        position: myLatLng,
        map,
        title: "Proletec TI - Área de Atuação",
    });
}