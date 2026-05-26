// Types extraits de la doc Grist Plugin API : https://support.getgrist.com/code/modules/grist_plugin_api/

interface ColumnToMap {
  /** Allow multiple column assignment, the result will be list of mapped table column names. */
  allowMultiple?: boolean;
  /** Optional long description of a column (used as a help text in section mapping). */
  description?: null | string;
  /** Column name that Widget expects. Must be a valid JSON property name. */
  name: string;
  /** Mark column as optional, all columns are required by default. */
  optional?: boolean;
  /** Match column type strictly, so "Any" will require "Any" and not any other type. */
  strictType?: boolean;
  /** Title or short description of a column (used as a label in section mapping). */
  title?: null | string;
  /** Column types (as comma separated list), by default "Any", what means that any type is allowed (unless strictType is true). */
  type?: string;
}

type ColumnsToMap = (string | ColumnToMap)[];

interface ReadyPayload {
  /** Show widget as linking source. */
  allowSelectBy?: boolean;
  /** Tells Grist what columns Custom Widget expects and allows user to map between existing column names and those requested by Custom Widget. */
  columns?: ColumnsToMap;
  /** Handler that will be called by Grist to open additional configuration panel inside the Custom Widget. */
  onEditOptions?: () => unknown;
  /** Required access level. If it wasn't granted already, Grist will prompt user to change the current access level. */
  requiredAccess?: string;
}

const enum GristObjCode {
  List = "L",
  LookUp = "l",
  Dict = "O",
  DateTime = "D",
  Date = "d",
  Censored = "C",
  Reference = "R",
  ReferenceList = "r",
  Exception = "E",
  Pending = "P",
  Skip = "S",
  Unmarshallable = "U",
  Versions = "V",
}

/** Possible types of cell content. Primitives or a tuple [GristObjCode, ...args]. */
type CellValue = number | string | boolean | null | [GristObjCode, ...unknown[]];

/** Map of column ids to CellValue's. */
type RowRecord = Record<string, CellValue>;

/** Current columns mapping between viewFields in section and Custom widget. */
type WidgetColumnMap = Record<string, string | string[] | null>;

interface FetchSelectedOptions {
  /**
   * rows: the returned data will be an array of objects, one per row, with column names as keys.
   * columns: the returned data will be an object with column names as keys, and arrays of values.
   */
  format?: "columns" | "rows";
  /**
   * shown (default): return only columns explicitly shown in the right panel configuration.
   * normal: return all normal columns, regardless of whether the user has shown them.
   * all: also return special invisible columns like manualSort and display helper columns.
   */
  includeColumns?: "shown" | "normal" | "all";
  /**
   * true: the returned data will contain raw CellValue's.
   * false: the values will be decoded, replacing e.g. ['D', timestamp] with a moment date.
   */
  keepEncoded?: boolean;
  /**
   * true (default): the returned data will show the contents of references, not their rowIds.
   * false: the returned data will only display rowIds for references.
   */
  expandRefs?: boolean;
}

/** Widget configuration set and approved by Grist, sent as part of ready message. */
interface InteractionOptions {
  /** Granted access level. */
  accessLevel: string;
}

interface GristPlugin {
  ready(settings?: ReadyPayload): void;
  /** Add a handler called whenever widget options change (and on initial ready message). Called with saved json options or null, and the widget's relationship with the document. */
  onOptions(callback: (options: unknown, settings: InteractionOptions) => unknown): void;
  /** Add a handler called whenever the row with the cursor changes. By default, options.keepEncoded is false. */
  onRecord(
    callback: (data: RowRecord | null, mappings: WidgetColumnMap | null) => unknown,
    options?: FetchSelectedOptions,
  ): void;
}

declare const grist: GristPlugin;
