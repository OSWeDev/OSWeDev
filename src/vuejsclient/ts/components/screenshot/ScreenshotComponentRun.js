
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

export async function take_video_capture() {
    try {
        // Capture de l'écran
        let capturedCanvas = [];
        let captureStream = await navigator.mediaDevices.getDisplayMedia({ preferCurrentTab: true });
        const track = captureStream.getVideoTracks()[0];
        await add_countdown_element();
        for (let i = 0; i < 2; i++) {
            document.getElementById("countdown").style.display = "flex";   
            await countdown(4);
            document.getElementById("countdown").style.display = "none";            
            const imageCapture = new ImageCapture(track);
            // Capture de l'image du flux vidéo
            let imageBitmap = await imageCapture.grabFrame();

            // Création du canvas et dessin de l'image capturée
            let canvas = document.createElement("canvas");
            canvas.width = imageBitmap.width;
            canvas.height = imageBitmap.height;
            canvas.getContext("2d").drawImage(imageBitmap, 0, 0);
            capturedCanvas.push(canvas);
            console.log("Image capturée");
        }

        track.stop(); // Arrêter le flux pour libérer les ressources

        // Retourner le tableau de canvas
        return capturedCanvas;
    } catch (error) {
        console.error("Erreur lors de la capture de l'écran :", error);
        return null;
    }
}

// Fonction de compte à rebours
async function countdown(seconds) {
    for (let i = seconds; i > 0; i--) {
        document.getElementById("countdown").textContent = i;
        console.log(`Capture d'écran dans ${i} seconde${i > 1 ? 's' : ''}...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1 seconde
    }
}

async function add_countdown_element() {
    let main = document.getElementById("VueMain");
    let countdownText = document.createTextNode("0");
    let div = document.createElement("div");
    div.id = "countdown";
    div.appendChild(countdownText);
    div.className = "videoCapture";
    main.appendChild(div);
}