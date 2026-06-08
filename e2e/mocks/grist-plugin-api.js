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
  // Returns the currently selected table ID.
  // Tests can override via window.__gristSelectedTableId.
  getSelectedTableId: async () => window.__gristSelectedTableId || "Table1",
  docApi: {
    // Stubs for _grist_Tables and _grist_Tables_column metadata tables.
    // Tests can inject column labels via window.__gristColumnLabels = { colId: "label" }.
    fetchTable: async (tableId) => {
      if (tableId === "_grist_Tables") {
        return { id: [1], tableId: [window.__gristSelectedTableId || "Table1"] };
      }
      if (tableId === "_grist_Tables_column") {
        const labels = window.__gristColumnLabels || {};
        const colIds = Object.keys(labels);
        return {
          id: colIds.map((_, i) => i + 1),
          parentId: colIds.map(() => 1),
          colId: colIds,
          label: colIds.map((id) => labels[id]),
        };
      }
      return {};
    },
  },
};
