window.grist = {
  ready: () => {},
  onRecord: (cb) => {
    window.__gristOnRecord = cb;
  },
  onRecords: (cb) => {
    window.__gristOnRecords = cb;
  },
};
