export async function take_fullsize_screenshot() {
    let captureStream = await navigator.mediaDevices.getDisplayMedia({ preferCurrentTab: true })
    const track = await captureStream.getVideoTracks()[0];
    let imageCapture = await new ImageCapture(track);
    await imageCapture.grabFrame().then((imageBitmap) => {
        let canvas = document.createElement("canvas");
        canvas.width = imageBitmap.width;
        canvas.height = imageBitmap.height;
        canvas.getContext("2d").drawImage(imageBitmap, 0, 0);
        console.dir(canvas)
        let imgURL = canvas.toDataURL("image/jpeg", 1.0);
        let img = document.createElement("img");
        img.src = imgURL;
        document.getElementById("screenshot").appendChild(img)
        track.stop();
    })
}