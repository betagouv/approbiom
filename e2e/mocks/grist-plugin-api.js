window.grist = {
  ready: (config) => {
    if (config?.onEditOptions) {
      window.__gristOnEditOptions = config.onEditOptions;
    }
  },
  onRecord: (cb) => {
    window.__gristOnRecord = cb;
  },
  onRecords: (cb) => {
    window.__gristOnRecords = cb;
  },
  onOptions: (cb) => {
    window.__gristOnOptions = cb;
  },
  setOption: async (key, value) => {
    window.__gristStoredOptions = { ...(window.__gristStoredOptions || {}), [key]: value };
    window.__gristOnOptions?.(window.__gristStoredOptions);
  },
};
