module.exports = {
  selectHost: 'Select Host',
  selectStage: 'Select Stage Environment Config',
  selectMode: 'Select Start Mode',
  selectNext: 'Do something after build',
  next: {
    upload: 'Upload assets',
    extract: 'Extract assets',
    both: 'Upload & Extract assets',
    exit: 'Exit',
  },
  mode: {
    build: 'Build + Upload + Extract',
    buildOnly: 'Build + Confirm Next',
    extract: 'Extract Assets in Build Folder',
    upload: 'Upload Assets from Build Folder',
  },
  startDev: 'Start Dev Server...',
  startBuild: 'Start Building...',
  buildSuccess: 'Build Success!',
  uploadCommandNotFound: 'Miss uploadCommand config.',
  startUpload: 'Start Uploading',
  afterBuildNotFound: 'Miss afterBuild config.',
  buildDirNotFound: 'Miss buildDir config.',
  buildHTMLNotFound: (htmlPath) => `${htmlPath} is not exist!`,

}
