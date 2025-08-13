function initMap() {
    const myLatLng = { lat: -23.55052, lng: -46.633308 }; // Exemplo: São Paulo
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 12,
        center: myLatLng,
    });

    new google.maps.Marker({
        position: myLatLng,
        map,
        title: "Proletec TI",
    });
}
