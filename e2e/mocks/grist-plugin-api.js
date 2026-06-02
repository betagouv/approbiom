window.grist = {
  ready: () => {},
  onRecord: (cb) => {
    window.__gristOnRecord = cb
  },
}
