export async function take_fullsize_screenshot() {
     try {
        // Capture de l'écran
        let captureStream = await navigator.mediaDevices.getDisplayMedia({ preferCurrentTab: true });
        const track = captureStream.getVideoTracks()[0];
        let imageCapture = new ImageCapture(track);

        // Capture de l'image du flux vidéo
        let imageBitmap = await imageCapture.grabFrame();

        // Arrêter le flux pour libérer les ressources
        track.stop();

        // Création du canvas et dessin de l'image capturée
        let canvas = document.createElement("canvas");
        canvas.width = imageBitmap.width;
        canvas.height = imageBitmap.height;
        canvas.getContext("2d").drawImage(imageBitmap, 0, 0);


        // Retourner le canvas
        return canvas;
    } catch (error) {
        console.error("Erreur lors de la capture de l'écran :", error);
        return null;
    }
}