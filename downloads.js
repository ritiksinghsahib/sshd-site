const downloadLinks = {
  windows: document.querySelector('[data-download="windows"]'),
  macos: document.querySelector('[data-download="macos"]'),
  linuxAppImage: document.querySelector('[data-download="linux-appimage"]'),
  linuxDeb: document.querySelector('[data-download="linux-deb"]')
};
const releaseStatus = document.querySelector("#release-status");
const supportedDownloadNames = Object.values(downloadLinks);

function setDownload(link, asset, label) {
  if (!asset) {
    link.removeAttribute("href");
    link.setAttribute("aria-disabled", "true");
    link.textContent = label;
    return;
  }
  link.href = asset.browser_download_url;
  link.setAttribute("aria-disabled", "false");
  link.setAttribute("download", "");
  link.textContent = label;
}

function chooseAsset(assets, expression) {
  return assets.find((asset) => expression.test(asset.name));
}

async function loadDownloads() {
  document.querySelector("#year").textContent = new Date().getFullYear();
  for (const link of supportedDownloadNames) setDownload(link, null, "Not published yet");

  const repository = window.SSHD_RELEASE_REPOSITORY;
  if (!repository || !/^[\w.-]+\/[\w.-]+$/.test(repository)) {
    releaseStatus.textContent = "Installers will be available here after the first public release.";
    return;
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${repository}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" }
    });
    if (response.status === 404) {
      releaseStatus.textContent = "The first installer release is not published yet.";
      return;
    }
    if (!response.ok) throw new Error(`Release lookup failed (${response.status}).`);

    const release = await response.json();
    const assets = release.assets || [];
    const windows = chooseAsset(assets, /^sshd-.*-win-x64\.exe$/i);
    const macos = chooseAsset(assets, /^sshd-.*-mac-(arm64|x64)\.dmg$/i);
    const appImage = chooseAsset(assets, /^sshd-.*-linux-x64\.AppImage$/i);
    const deb = chooseAsset(assets, /^sshd-.*-linux-x64\.deb$/i);

    setDownload(downloadLinks.windows, windows, windows ? "Download for Windows" : "Windows build unavailable");
    setDownload(downloadLinks.macos, macos, macos ? "Download for macOS" : "macOS build unavailable");
    setDownload(downloadLinks.linuxAppImage, appImage, appImage ? "AppImage" : "AppImage unavailable");
    setDownload(downloadLinks.linuxDeb, deb, deb ? "Download .deb" : ".deb unavailable");
    releaseStatus.textContent = release.tag_name
      ? `Latest release ${release.tag_name} · ${new Date(release.published_at).toLocaleDateString()}`
      : "Latest stable sshd release";
  } catch (error) {
    releaseStatus.textContent = "Release downloads could not be loaded. Please try again later.";
    console.error("Could not load sshd release downloads:", error);
  }
}

loadDownloads();
