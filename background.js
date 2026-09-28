// MINE MC Animated Background

const background = document.createElement("div");

background.className = "mc-background";

background.innerHTML = `
    <div class="mc-grid"></div>

    <div class="mc-particles">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
    </div>

    <div class="mc-vignette"></div>
`;

document.body.prepend(background);
