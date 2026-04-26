var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/types/audio-formats.ts
function isNamedAudioInput(input) {
  return typeof input === "object" && input !== null && "name" in input && "data" in input && !(input instanceof File) && !(input instanceof Uint8Array) && !(input instanceof ArrayBuffer);
}
var init_audio_formats = __esm({
  "src/types/audio-formats.ts"() {
    "use strict";
  }
});

// src/types/tags.ts
var init_tags = __esm({
  "src/types/tags.ts"() {
    "use strict";
  }
});

// src/types/metadata-mappings.ts
var init_metadata_mappings = __esm({
  "src/types/metadata-mappings.ts"() {
    "use strict";
  }
});

// src/types/pictures.ts
var PICTURE_TYPE_VALUES, PICTURE_TYPE_NAMES, BITRATE_CONTROL_MODE_VALUES, BITRATE_CONTROL_MODE_NAMES;
var init_pictures = __esm({
  "src/types/pictures.ts"() {
    "use strict";
    PICTURE_TYPE_VALUES = {
      Other: 0,
      FileIcon: 1,
      OtherFileIcon: 2,
      FrontCover: 3,
      BackCover: 4,
      LeafletPage: 5,
      Media: 6,
      LeadArtist: 7,
      Artist: 8,
      Conductor: 9,
      Band: 10,
      Composer: 11,
      Lyricist: 12,
      RecordingLocation: 13,
      DuringRecording: 14,
      DuringPerformance: 15,
      MovieScreenCapture: 16,
      ColouredFish: 17,
      Illustration: 18,
      BandLogo: 19,
      PublisherLogo: 20
    };
    PICTURE_TYPE_NAMES = {
      0: "Other",
      1: "FileIcon",
      2: "OtherFileIcon",
      3: "FrontCover",
      4: "BackCover",
      5: "LeafletPage",
      6: "Media",
      7: "LeadArtist",
      8: "Artist",
      9: "Conductor",
      10: "Band",
      11: "Composer",
      12: "Lyricist",
      13: "RecordingLocation",
      14: "DuringRecording",
      15: "DuringPerformance",
      16: "MovieScreenCapture",
      17: "ColouredFish",
      18: "Illustration",
      19: "BandLogo",
      20: "PublisherLogo"
    };
    BITRATE_CONTROL_MODE_VALUES = {
      Constant: 0,
      LongTermAverage: 1,
      VariableConstrained: 2,
      Variable: 3
    };
    BITRATE_CONTROL_MODE_NAMES = {
      0: "Constant",
      1: "LongTermAverage",
      2: "VariableConstrained",
      3: "Variable"
    };
  }
});

// src/types/config.ts
var init_config = __esm({
  "src/types/config.ts"() {
    "use strict";
  }
});

// src/types/format-property-keys.ts
var init_format_property_keys = __esm({
  "src/types/format-property-keys.ts"() {
    "use strict";
  }
});

// src/types/index.ts
var init_types = __esm({
  "src/types/index.ts"() {
    "use strict";
    init_audio_formats();
    init_tags();
    init_metadata_mappings();
    init_pictures();
    init_config();
    init_format_property_keys();
  }
});

// src/types.ts
var init_types2 = __esm({
  "src/types.ts"() {
    "use strict";
    init_types();
  }
});

// src/errors/base.ts
var SUPPORTED_FORMATS, TagLibError;
var init_base = __esm({
  "src/errors/base.ts"() {
    "use strict";
    SUPPORTED_FORMATS = [
      "MP3",
      "MP4",
      "M4A",
      "FLAC",
      "OGG",
      "WAV",
      "MKA"
    ];
    TagLibError = class _TagLibError extends Error {
      /**
       * Creates a new TagLibError
       * @param code - Error code for programmatic handling
       * @param message - Human-readable error message
       * @param details - Additional context about the error
       */
      constructor(code, message, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = "TagLibError";
        Object.setPrototypeOf(this, _TagLibError.prototype);
      }
    };
  }
});

// src/errors/classes.ts
function createErrorMessage(prefix, details) {
  return `${prefix}: ${details}`;
}
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
var TagLibInitializationError, InvalidFormatError, UnsupportedFormatError, FileOperationError, MetadataError, MemoryError, EnvironmentError;
var init_classes = __esm({
  "src/errors/classes.ts"() {
    "use strict";
    init_base();
    TagLibInitializationError = class _TagLibInitializationError extends TagLibError {
      /**
       * Creates a new TagLibInitializationError
       * @param message - Description of the initialization failure
       * @param details - Additional context about the error
       */
      constructor(message, details) {
        super(
          "INITIALIZATION",
          createErrorMessage("Failed to initialize TagLib Wasm module", message),
          details
        );
        this.name = "TagLibInitializationError";
        Object.setPrototypeOf(this, _TagLibInitializationError.prototype);
      }
    };
    InvalidFormatError = class _InvalidFormatError extends TagLibError {
      /**
       * Creates a new InvalidFormatError
       * @param message - Description of the format error
       * @param bufferSize - Size of the audio buffer in bytes
       * @param details - Additional context about the error
       */
      constructor(message, bufferSize, details) {
        const errorDetails = [`Invalid audio file format: ${message}`];
        if (bufferSize !== void 0) {
          errorDetails.push(`Buffer size: ${formatFileSize(bufferSize)}`);
          if (bufferSize < 1024) {
            errorDetails.push(
              "Audio files must be at least 1KB to contain valid headers."
            );
          }
        }
        super(
          "INVALID_FORMAT",
          errorDetails.join(". "),
          { ...details, bufferSize }
        );
        this.bufferSize = bufferSize;
        this.name = "InvalidFormatError";
        Object.setPrototypeOf(this, _InvalidFormatError.prototype);
      }
    };
    UnsupportedFormatError = class _UnsupportedFormatError extends TagLibError {
      /**
       * Creates a new UnsupportedFormatError
       * @param format - The unsupported format that was encountered
       * @param supportedFormats - List of formats that are supported
       * @param details - Additional context about the error
       */
      constructor(format, supportedFormats = SUPPORTED_FORMATS, details) {
        super(
          "UNSUPPORTED_FORMAT",
          `Unsupported audio format: ${format}. Supported formats: ${supportedFormats.join(", ")}`,
          { ...details, format, supportedFormats }
        );
        this.format = format;
        this.supportedFormats = supportedFormats;
        this.name = "UnsupportedFormatError";
        Object.setPrototypeOf(this, _UnsupportedFormatError.prototype);
      }
    };
    FileOperationError = class _FileOperationError extends TagLibError {
      /**
       * Creates a new FileOperationError
       * @param operation - The file operation that failed
       * @param message - Description of the failure
       * @param path - File path involved in the operation
       * @param details - Additional context about the error
       */
      constructor(operation, message, path, details) {
        const errorDetails = [`Failed to ${operation} file`];
        if (path) {
          errorDetails.push(`Path: ${path}`);
        }
        errorDetails.push(message);
        super(
          "FILE_OPERATION",
          errorDetails.join(". "),
          { ...details, operation, path }
        );
        this.operation = operation;
        this.path = path;
        this.name = "FileOperationError";
        Object.setPrototypeOf(this, _FileOperationError.prototype);
      }
    };
    MetadataError = class _MetadataError extends TagLibError {
      /**
       * Creates a new MetadataError
       * @param operation - The metadata operation that failed
       * @param message - Description of the failure
       * @param field - The metadata field involved
       * @param details - Additional context about the error
       */
      constructor(operation, message, field, details) {
        const errorDetails = [`Failed to ${operation} metadata`];
        if (field) {
          errorDetails.push(`Field: ${field}`);
        }
        errorDetails.push(message);
        super(
          "METADATA",
          errorDetails.join(". "),
          { ...details, operation, field }
        );
        this.operation = operation;
        this.field = field;
        this.name = "MetadataError";
        Object.setPrototypeOf(this, _MetadataError.prototype);
      }
    };
    MemoryError = class _MemoryError extends TagLibError {
      /**
       * Creates a new MemoryError
       * @param message - Description of the memory failure
       * @param details - Additional context about the error
       */
      constructor(message, details) {
        super(
          "MEMORY",
          createErrorMessage("Memory allocation failed", message),
          details
        );
        this.name = "MemoryError";
        Object.setPrototypeOf(this, _MemoryError.prototype);
      }
    };
    EnvironmentError = class _EnvironmentError extends TagLibError {
      /**
       * Creates a new EnvironmentError
       * @param environment - The runtime environment name
       * @param reason - Why the environment is incompatible
       * @param requiredFeature - The feature that is missing
       */
      constructor(environment, reason, requiredFeature) {
        const message = requiredFeature ? `Environment '${environment}' ${reason}. Required feature: ${requiredFeature}.` : `Environment '${environment}' ${reason}.`;
        super("ENVIRONMENT", message);
        this.environment = environment;
        this.reason = reason;
        this.requiredFeature = requiredFeature;
        this.name = "EnvironmentError";
        Object.setPrototypeOf(this, _EnvironmentError.prototype);
      }
    };
  }
});

// src/errors/guards.ts
function isTagLibError(error) {
  return error instanceof TagLibError;
}
function isInvalidFormatError(error) {
  return error instanceof InvalidFormatError;
}
function isUnsupportedFormatError(error) {
  return error instanceof UnsupportedFormatError;
}
function isFileOperationError(error) {
  return error instanceof FileOperationError;
}
function isMetadataError(error) {
  return error instanceof MetadataError;
}
function isMemoryError(error) {
  return error instanceof MemoryError;
}
function isEnvironmentError(error) {
  return error instanceof EnvironmentError;
}
var init_guards = __esm({
  "src/errors/guards.ts"() {
    "use strict";
    init_base();
    init_classes();
  }
});

// src/errors/index.ts
var init_errors = __esm({
  "src/errors/index.ts"() {
    "use strict";
    init_base();
    init_classes();
    init_guards();
  }
});

// src/errors.ts
var init_errors2 = __esm({
  "src/errors.ts"() {
    "use strict";
    init_errors();
  }
});

// browser-stub:platform-io-browser-stub
function getPlatformIO() {
  throw new Error("Filesystem operations are not available in the browser.");
}
var init_platform_io_browser_stub = __esm({
  "browser-stub:platform-io-browser-stub"() {
  }
});

// src/utils/file.ts
async function readFileData(file) {
  if (file instanceof Uint8Array) return file;
  if (file instanceof ArrayBuffer) return new Uint8Array(file);
  if (typeof File !== "undefined" && file instanceof File) {
    return new Uint8Array(await file.arrayBuffer());
  }
  if (typeof file === "string") {
    try {
      return await getPlatformIO().readFile(file);
    } catch (error) {
      if (error instanceof EnvironmentError) throw error;
      throw new FileOperationError("read", error.message, file);
    }
  }
  const inputType = Object.prototype.toString.call(file);
  throw new FileOperationError(
    "read",
    `Invalid file input type: ${inputType}. Expected string path, Uint8Array, ArrayBuffer, or File object.`
  );
}
async function getFileSize(path) {
  try {
    const s = await getPlatformIO().stat(path);
    return s.size;
  } catch (error) {
    if (error instanceof EnvironmentError) throw error;
    throw new FileOperationError("stat", error.message, path);
  }
}
async function readPartialFileData(path, headerSize, footerSize) {
  const io = getPlatformIO();
  if (!io.readPartial) {
    throw new EnvironmentError(
      "current runtime",
      "does not support partial file reading",
      "filesystem access with seek support"
    );
  }
  try {
    return await io.readPartial(path, headerSize, footerSize);
  } catch (error) {
    if (error instanceof EnvironmentError) throw error;
    throw new FileOperationError("read", error.message, path);
  }
}
var init_file = __esm({
  "src/utils/file.ts"() {
    "use strict";
    init_errors2();
    init_platform_io_browser_stub();
  }
});

// src/utils/write.ts
async function writeFileData(path, data) {
  try {
    await getPlatformIO().writeFile(path, data);
  } catch (error) {
    if (error instanceof EnvironmentError) throw error;
    throw new FileOperationError(
      "write",
      error.message,
      path
    );
  }
}
var init_write = __esm({
  "src/utils/write.ts"() {
    "use strict";
    init_errors2();
    init_platform_io_browser_stub();
  }
});

// src/constants/additional-properties.ts
var ADDITIONAL_PROPERTIES;
var init_additional_properties = __esm({
  "src/constants/additional-properties.ts"() {
    "use strict";
    ADDITIONAL_PROPERTIES = {
      albumArtistSort: {
        key: "ALBUMARTISTSORT",
        description: "Sort name for album artist (for alphabetization)",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TSO2" },
          vorbis: "ALBUMARTISTSORT",
          mp4: "soaa"
        }
      },
      composerSort: {
        key: "COMPOSERSORT",
        description: "Sort name for composer (for alphabetization)",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TSOC" },
          vorbis: "COMPOSERSORT",
          mp4: "soco"
        }
      },
      subtitle: {
        key: "SUBTITLE",
        description: "Subtitle or description refinement",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TIT3" },
          vorbis: "SUBTITLE",
          mp4: "----:com.apple.iTunes:SUBTITLE"
        }
      },
      label: {
        key: "LABEL",
        description: "Record label name",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis", "WAV"],
        mappings: {
          id3v2: { frame: "TPUB" },
          vorbis: "LABEL",
          mp4: "----:com.apple.iTunes:LABEL",
          wav: "IPUB"
        }
      },
      producer: {
        key: "PRODUCER",
        description: "Producer of the recording",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TXXX", description: "PRODUCER" },
          vorbis: "PRODUCER",
          mp4: "----:com.apple.iTunes:PRODUCER"
        }
      },
      radioStationOwner: {
        key: "RADIOSTATIONOWNER",
        description: "Owner of the radio station",
        type: "string",
        supportedFormats: ["ID3v2"],
        mappings: {
          id3v2: { frame: "TRSO" }
        }
      },
      asin: {
        key: "ASIN",
        description: "Amazon Standard Identification Number",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TXXX", description: "ASIN" },
          vorbis: "ASIN",
          mp4: "----:com.apple.iTunes:ASIN"
        }
      },
      musicbrainzReleaseArtistId: {
        key: "MUSICBRAINZ_ALBUMARTISTID",
        description: "MusicBrainz Release Artist ID (UUID)",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: {
            frame: "TXXX",
            description: "MusicBrainz Album Artist Id"
          },
          vorbis: "MUSICBRAINZ_ALBUMARTISTID",
          mp4: "----:com.apple.iTunes:MusicBrainz Album Artist Id"
        }
      },
      musicbrainzWorkId: {
        key: "MUSICBRAINZ_WORKID",
        description: "MusicBrainz Work ID (UUID)",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TXXX", description: "MusicBrainz Work Id" },
          vorbis: "MUSICBRAINZ_WORKID",
          mp4: "----:com.apple.iTunes:MusicBrainz Work Id"
        }
      },
      musicbrainzReleaseTrackId: {
        key: "MUSICBRAINZ_RELEASETRACKID",
        description: "MusicBrainz Release Track ID (UUID)",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: {
            frame: "TXXX",
            description: "MusicBrainz Release Track Id"
          },
          vorbis: "MUSICBRAINZ_RELEASETRACKID",
          mp4: "----:com.apple.iTunes:MusicBrainz Release Track Id"
        }
      },
      podcastId: {
        key: "PODCASTID",
        description: "Podcast episode identifier",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TGID" },
          vorbis: "PODCASTID",
          mp4: "egid"
        }
      },
      podcastUrl: {
        key: "PODCASTURL",
        description: "Podcast feed URL",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "WFED" },
          vorbis: "PODCASTURL",
          mp4: "purl"
        }
      },
      originalArtist: {
        key: "ORIGINALARTIST",
        description: "Original artist of a cover or remix",
        type: "string",
        supportedFormats: ["ID3v2", "Vorbis"],
        mappings: {
          id3v2: { frame: "TOPE" },
          vorbis: "ORIGINALARTIST"
        }
      },
      originalAlbum: {
        key: "ORIGINALALBUM",
        description: "Original album of a cover or remix",
        type: "string",
        supportedFormats: ["ID3v2", "Vorbis"],
        mappings: {
          id3v2: { frame: "TOAL" },
          vorbis: "ORIGINALALBUM"
        }
      },
      originalDate: {
        key: "ORIGINALDATE",
        description: "Original release date",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TDOR" },
          vorbis: "ORIGINALDATE",
          mp4: "----:com.apple.iTunes:ORIGINALDATE"
        }
      },
      script: {
        key: "SCRIPT",
        description: "Writing script used for text (e.g., Latn, Jpan)",
        type: "string",
        supportedFormats: ["MP4", "Vorbis"],
        mappings: {
          vorbis: "SCRIPT",
          mp4: "----:com.apple.iTunes:SCRIPT"
        }
      },
      involvedPeople: {
        key: "INVOLVEDPEOPLE",
        description: "List of involved people and their roles",
        type: "string",
        supportedFormats: ["ID3v2"],
        mappings: {
          id3v2: { frame: "TIPL" }
        }
      },
      encoding: {
        key: "ENCODING",
        description: "Encoding software or settings",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis", "WAV"],
        mappings: {
          id3v2: { frame: "TSSE" },
          vorbis: "ENCODING",
          mp4: "\xA9too",
          wav: "ISFT"
        }
      }
    };
  }
});

// src/constants/basic-properties.ts
var BASIC_PROPERTIES;
var init_basic_properties = __esm({
  "src/constants/basic-properties.ts"() {
    "use strict";
    BASIC_PROPERTIES = {
      title: {
        key: "TITLE",
        description: "The title of the track",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis", "WAV"],
        mappings: {
          id3v2: { frame: "TIT2" },
          vorbis: "TITLE",
          mp4: "\xA9nam",
          wav: "INAM"
        }
      },
      artist: {
        key: "ARTIST",
        description: "The primary performer(s) of the track",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis", "WAV"],
        mappings: {
          id3v2: { frame: "TPE1" },
          vorbis: "ARTIST",
          mp4: "\xA9ART",
          wav: "IART"
        }
      },
      album: {
        key: "ALBUM",
        description: "The album/collection name",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis", "WAV"],
        mappings: {
          id3v2: { frame: "TALB" },
          vorbis: "ALBUM",
          mp4: "\xA9alb",
          wav: "IPRD"
        }
      },
      date: {
        key: "DATE",
        description: "The date of recording (typically year)",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis", "WAV"],
        mappings: {
          id3v2: { frame: "TDRC" },
          vorbis: "DATE",
          mp4: "\xA9day",
          wav: "ICRD"
        }
      },
      trackNumber: {
        key: "TRACKNUMBER",
        description: "The track number within the album",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis", "WAV"],
        mappings: {
          id3v2: { frame: "TRCK" },
          vorbis: "TRACKNUMBER",
          mp4: "trkn",
          wav: "ITRK"
        }
      },
      genre: {
        key: "GENRE",
        description: "The musical genre",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis", "WAV"],
        mappings: {
          id3v2: { frame: "TCON" },
          vorbis: "GENRE",
          mp4: "\xA9gen",
          wav: "IGNR"
        }
      },
      comment: {
        key: "COMMENT",
        description: "Comments or notes about the track",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis", "WAV"],
        mappings: {
          id3v2: { frame: "COMM" },
          vorbis: "COMMENT",
          mp4: "\xA9cmt",
          wav: "ICMT"
        }
      }
    };
  }
});

// src/constants/general-extended-properties.ts
var GENERAL_EXTENDED_PROPERTIES;
var init_general_extended_properties = __esm({
  "src/constants/general-extended-properties.ts"() {
    "use strict";
    GENERAL_EXTENDED_PROPERTIES = {
      albumArtist: {
        key: "ALBUMARTIST",
        description: "The album artist (band/orchestra/ensemble)",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TPE2" },
          vorbis: "ALBUMARTIST",
          mp4: "aART"
        }
      },
      composer: {
        key: "COMPOSER",
        description: "The original composer(s) of the track",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TCOM" },
          vorbis: "COMPOSER",
          mp4: "\xA9wrt"
        }
      },
      copyright: {
        key: "COPYRIGHT",
        description: "Copyright information",
        type: "string",
        supportedFormats: ["ID3v2", "Vorbis"],
        mappings: {
          vorbis: "COPYRIGHT"
        }
      },
      encodedBy: {
        key: "ENCODEDBY",
        description: "The encoding software or person",
        type: "string",
        supportedFormats: ["ID3v2", "Vorbis"],
        mappings: {
          vorbis: "ENCODEDBY"
        }
      },
      discNumber: {
        key: "DISCNUMBER",
        description: "The disc number for multi-disc sets",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TPOS" },
          vorbis: "DISCNUMBER",
          mp4: "disk"
        }
      },
      bpm: {
        key: "BPM",
        description: "Beats per minute",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TBPM" },
          vorbis: "BPM",
          mp4: "tmpo"
        }
      },
      totalTracks: {
        key: "TRACKTOTAL",
        description: "Total number of tracks on the album",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TRCK" },
          vorbis: "TRACKTOTAL",
          mp4: "trkn"
        }
      },
      totalDiscs: {
        key: "DISCTOTAL",
        description: "Total number of discs in the set",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TPOS" },
          vorbis: "DISCTOTAL",
          mp4: "disk"
        }
      },
      compilation: {
        key: "COMPILATION",
        description: "Whether the album is a compilation (various artists)",
        type: "boolean",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TCMP" },
          vorbis: "COMPILATION",
          mp4: "cpil"
        }
      },
      // Sorting Properties
      titleSort: {
        key: "TITLESORT",
        description: "Sort name for title (for alphabetization)",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TSOT" },
          vorbis: "TITLESORT",
          mp4: "sonm"
        }
      },
      artistSort: {
        key: "ARTISTSORT",
        description: "Sort name for artist (for alphabetization)",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TSOP" },
          vorbis: "ARTISTSORT",
          mp4: "soar"
        }
      },
      albumSort: {
        key: "ALBUMSORT",
        description: "Sort name for album (for alphabetization)",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TSOA" },
          vorbis: "ALBUMSORT",
          mp4: "soal"
        }
      },
      // Additional common properties
      lyricist: {
        key: "LYRICIST",
        description: "The lyrics/text writer(s)",
        type: "string",
        supportedFormats: ["Vorbis"],
        mappings: {
          vorbis: "LYRICIST"
        }
      },
      conductor: {
        key: "CONDUCTOR",
        description: "The conductor",
        type: "string",
        supportedFormats: ["Vorbis"],
        mappings: {
          vorbis: "CONDUCTOR"
        }
      },
      remixedBy: {
        key: "REMIXER",
        description: "Person who remixed the track",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TPE4" },
          vorbis: "REMIXER",
          mp4: "----:com.apple.iTunes:REMIXER"
        }
      },
      language: {
        key: "LANGUAGE",
        description: "Language of vocals/lyrics",
        type: "string",
        supportedFormats: ["Vorbis"],
        mappings: {
          vorbis: "LANGUAGE"
        }
      },
      publisher: {
        key: "PUBLISHER",
        description: "The publisher",
        type: "string",
        supportedFormats: ["Vorbis"],
        mappings: {
          vorbis: "PUBLISHER"
        }
      },
      mood: {
        key: "MOOD",
        description: "The mood/atmosphere of the track",
        type: "string",
        supportedFormats: ["Vorbis"],
        mappings: {
          vorbis: "MOOD"
        }
      },
      media: {
        key: "MEDIA",
        description: "Media type (CD, vinyl, etc.)",
        type: "string",
        supportedFormats: ["Vorbis"],
        mappings: {
          vorbis: "MEDIA"
        }
      },
      grouping: {
        key: "GROUPING",
        description: "Content group/work",
        type: "string",
        supportedFormats: ["Vorbis"],
        mappings: {
          vorbis: "GROUPING"
        }
      },
      work: {
        key: "WORK",
        description: "Work name",
        type: "string",
        supportedFormats: ["Vorbis"],
        mappings: {
          vorbis: "WORK"
        }
      },
      lyrics: {
        key: "LYRICS",
        description: "Lyrics content",
        type: "string",
        supportedFormats: ["Vorbis"],
        mappings: {
          vorbis: "LYRICS"
        }
      },
      isrc: {
        key: "ISRC",
        description: "International Standard Recording Code",
        type: "string",
        supportedFormats: ["Vorbis"],
        mappings: {
          vorbis: "ISRC"
        }
      },
      catalogNumber: {
        key: "CATALOGNUMBER",
        description: "Catalog number",
        type: "string",
        supportedFormats: ["Vorbis"],
        mappings: {
          vorbis: "CATALOGNUMBER"
        }
      },
      barcode: {
        key: "BARCODE",
        description: "Barcode (EAN/UPC)",
        type: "string",
        supportedFormats: ["Vorbis"],
        mappings: {
          vorbis: "BARCODE"
        }
      }
    };
  }
});

// src/constants/specialized-properties.ts
var SPECIALIZED_PROPERTIES;
var init_specialized_properties = __esm({
  "src/constants/specialized-properties.ts"() {
    "use strict";
    SPECIALIZED_PROPERTIES = {
      // MusicBrainz Identifiers
      musicbrainzArtistId: {
        key: "MUSICBRAINZ_ARTISTID",
        description: "MusicBrainz Artist ID (UUID)",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TXXX", description: "MusicBrainz Artist Id" },
          vorbis: "MUSICBRAINZ_ARTISTID",
          mp4: "----:com.apple.iTunes:MusicBrainz Artist Id"
        }
      },
      musicbrainzReleaseId: {
        key: "MUSICBRAINZ_ALBUMID",
        description: "MusicBrainz Release ID (UUID)",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TXXX", description: "MusicBrainz Album Id" },
          vorbis: "MUSICBRAINZ_ALBUMID",
          mp4: "----:com.apple.iTunes:MusicBrainz Album Id"
        }
      },
      musicbrainzTrackId: {
        key: "MUSICBRAINZ_TRACKID",
        description: "MusicBrainz Recording ID (UUID)",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "UFID", description: "http://musicbrainz.org" },
          vorbis: "MUSICBRAINZ_TRACKID",
          mp4: "----:com.apple.iTunes:MusicBrainz Track Id"
        }
      },
      musicbrainzReleaseGroupId: {
        key: "MUSICBRAINZ_RELEASEGROUPID",
        description: "MusicBrainz Release Group ID (UUID)",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TXXX", description: "MusicBrainz Release Group Id" },
          vorbis: "MUSICBRAINZ_RELEASEGROUPID",
          mp4: "----:com.apple.iTunes:MusicBrainz Release Group Id"
        }
      },
      // ReplayGain Properties
      replayGainTrackGain: {
        key: "REPLAYGAIN_TRACK_GAIN",
        description: "ReplayGain track gain in dB (e.g., '-6.54 dB')",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TXXX", description: "ReplayGain_Track_Gain" },
          vorbis: "REPLAYGAIN_TRACK_GAIN",
          mp4: "----:com.apple.iTunes:replaygain_track_gain"
        }
      },
      replayGainTrackPeak: {
        key: "REPLAYGAIN_TRACK_PEAK",
        description: "ReplayGain track peak value (0.0-1.0)",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TXXX", description: "ReplayGain_Track_Peak" },
          vorbis: "REPLAYGAIN_TRACK_PEAK",
          mp4: "----:com.apple.iTunes:replaygain_track_peak"
        }
      },
      replayGainAlbumGain: {
        key: "REPLAYGAIN_ALBUM_GAIN",
        description: "ReplayGain album gain in dB",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TXXX", description: "ReplayGain_Album_Gain" },
          vorbis: "REPLAYGAIN_ALBUM_GAIN",
          mp4: "----:com.apple.iTunes:replaygain_album_gain"
        }
      },
      replayGainAlbumPeak: {
        key: "REPLAYGAIN_ALBUM_PEAK",
        description: "ReplayGain album peak value (0.0-1.0)",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TXXX", description: "ReplayGain_Album_Peak" },
          vorbis: "REPLAYGAIN_ALBUM_PEAK",
          mp4: "----:com.apple.iTunes:replaygain_album_peak"
        }
      },
      // AcoustID Properties
      acoustidFingerprint: {
        key: "ACOUSTID_FINGERPRINT",
        description: "AcoustID fingerprint (Chromaprint)",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TXXX", description: "Acoustid Fingerprint" },
          vorbis: "ACOUSTID_FINGERPRINT",
          mp4: "----:com.apple.iTunes:Acoustid Fingerprint"
        }
      },
      acoustidId: {
        key: "ACOUSTID_ID",
        description: "AcoustID UUID",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TXXX", description: "Acoustid Id" },
          vorbis: "ACOUSTID_ID",
          mp4: "----:com.apple.iTunes:Acoustid Id"
        }
      },
      // Apple Sound Check
      appleSoundCheck: {
        key: "ITUNNORM",
        description: "Apple Sound Check normalization data",
        type: "string",
        supportedFormats: ["ID3v2", "MP4", "Vorbis"],
        mappings: {
          id3v2: { frame: "TXXX", description: "iTunNORM" },
          vorbis: "ITUNNORM",
          mp4: "----:com.apple.iTunes:iTunNORM"
        }
      }
    };
  }
});

// src/constants/properties.ts
function toTagLibKey(key) {
  return _toTagLib[key] ?? key;
}
function fromTagLibKey(key) {
  return _fromTagLib[key] ?? key;
}
function remapKeysFromTagLib(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[fromTagLibKey(key)] = value;
  }
  return result;
}
var PROPERTIES, _toTagLib, _fromTagLib;
var init_properties = __esm({
  "src/constants/properties.ts"() {
    "use strict";
    init_additional_properties();
    init_basic_properties();
    init_general_extended_properties();
    init_specialized_properties();
    PROPERTIES = {
      ...BASIC_PROPERTIES,
      ...GENERAL_EXTENDED_PROPERTIES,
      ...SPECIALIZED_PROPERTIES,
      ...ADDITIONAL_PROPERTIES
    };
    _toTagLib = {};
    _fromTagLib = {};
    for (const [camelKey, meta] of Object.entries(PROPERTIES)) {
      const wireKey = meta.key;
      _toTagLib[camelKey] = wireKey;
      _fromTagLib[wireKey] = camelKey;
    }
    _toTagLib["year"] = "DATE";
    _toTagLib["track"] = "TRACKNUMBER";
    _fromTagLib["disc"] = "discNumber";
  }
});

// src/taglib/audio-file-base.ts
var BaseAudioFileImpl;
var init_audio_file_base = __esm({
  "src/taglib/audio-file-base.ts"() {
    "use strict";
    init_properties();
    init_errors2();
    BaseAudioFileImpl = class {
      constructor(module, fileHandle, sourcePath, originalSource, isPartiallyLoaded = false, partialLoadOptions) {
        this.module = module;
        __publicField(this, "fileHandle");
        __publicField(this, "cachedAudioProperties", null);
        __publicField(this, "sourcePath");
        __publicField(this, "originalSource");
        __publicField(this, "isPartiallyLoaded", false);
        __publicField(this, "partialLoadOptions");
        this.fileHandle = fileHandle;
        this.sourcePath = sourcePath;
        this.originalSource = originalSource;
        this.isPartiallyLoaded = isPartiallyLoaded;
        this.partialLoadOptions = partialLoadOptions;
      }
      get handle() {
        if (!this.fileHandle) {
          throw new MetadataError("read", "File handle has been disposed");
        }
        return this.fileHandle;
      }
      getFormat() {
        return this.handle.getFormat();
      }
      isFormat(format) {
        return this.getFormat() === format;
      }
      tag() {
        const handle = this.handle;
        let data = handle.getTagData();
        const tag = {
          get title() {
            return data.title;
          },
          get artist() {
            return data.artist;
          },
          get album() {
            return data.album;
          },
          get comment() {
            return data.comment;
          },
          get genre() {
            return data.genre;
          },
          get year() {
            return data.year;
          },
          get track() {
            return data.track;
          },
          setTitle: (value) => {
            handle.setTagData({ title: value });
            data = handle.getTagData();
            return tag;
          },
          setArtist: (value) => {
            handle.setTagData({ artist: value });
            data = handle.getTagData();
            return tag;
          },
          setAlbum: (value) => {
            handle.setTagData({ album: value });
            data = handle.getTagData();
            return tag;
          },
          setComment: (value) => {
            handle.setTagData({ comment: value });
            data = handle.getTagData();
            return tag;
          },
          setGenre: (value) => {
            handle.setTagData({ genre: value });
            data = handle.getTagData();
            return tag;
          },
          setYear: (value) => {
            handle.setTagData({ year: value });
            data = handle.getTagData();
            return tag;
          },
          setTrack: (value) => {
            handle.setTagData({ track: value });
            data = handle.getTagData();
            return tag;
          }
        };
        return tag;
      }
      audioProperties() {
        if (!this.cachedAudioProperties) {
          this.cachedAudioProperties = this.handle.getAudioProperties() ?? null;
        }
        return this.cachedAudioProperties ?? void 0;
      }
      properties() {
        return remapKeysFromTagLib(this.handle.getProperties());
      }
      setProperties(properties) {
        const translated = {};
        for (const [key, values] of Object.entries(properties)) {
          if (values !== void 0) translated[toTagLibKey(key)] = values;
        }
        this.handle.setProperties(translated);
      }
      getProperty(key) {
        const value = this.handle.getProperty(toTagLibKey(key));
        return value === "" ? void 0 : value;
      }
      setProperty(key, value) {
        this.handle.setProperty(toTagLibKey(key), value);
      }
      isMP4() {
        return this.handle.isMP4();
      }
      getMP4Item(key) {
        if (!this.isMP4()) {
          throw new UnsupportedFormatError(this.getFormat(), ["MP4", "M4A"]);
        }
        const value = this.handle.getMP4Item(key);
        return value === "" ? void 0 : value;
      }
      setMP4Item(key, value) {
        if (!this.isMP4()) {
          throw new UnsupportedFormatError(this.getFormat(), ["MP4", "M4A"]);
        }
        this.handle.setMP4Item(key, value);
      }
      removeMP4Item(key) {
        if (!this.isMP4()) {
          throw new UnsupportedFormatError(this.getFormat(), ["MP4", "M4A"]);
        }
        this.handle.removeMP4Item(key);
      }
      isValid() {
        return this.handle.isValid();
      }
      dispose() {
        if (this.fileHandle) {
          this.fileHandle.destroy();
          this.fileHandle = null;
          this.cachedAudioProperties = null;
        }
      }
      [Symbol.dispose]() {
        this.dispose();
      }
    };
  }
});

// src/taglib/embind-adapter.ts
function wrapEmbindHandle(raw) {
  const overrides = {
    getTagData() {
      const tw = raw.getTag();
      return {
        title: tw.title(),
        artist: tw.artist(),
        album: tw.album(),
        comment: tw.comment(),
        genre: tw.genre(),
        year: tw.year(),
        track: tw.track()
      };
    },
    setTagData(data) {
      const tw = raw.getTag();
      if (data.title !== void 0) tw.setTitle(data.title);
      if (data.artist !== void 0) tw.setArtist(data.artist);
      if (data.album !== void 0) tw.setAlbum(data.album);
      if (data.comment !== void 0) tw.setComment(data.comment);
      if (data.genre !== void 0) tw.setGenre(data.genre);
      if (data.year !== void 0) tw.setYear(data.year);
      if (data.track !== void 0) tw.setTrack(data.track);
    },
    getAudioProperties() {
      const pw = raw.getAudioProperties();
      if (!pw) return null;
      const containerFormat = pw.containerFormat() || "unknown";
      const mpegVersion = pw.mpegVersion();
      const formatVersion = pw.formatVersion();
      return {
        duration: pw.lengthInSeconds(),
        durationMs: pw.lengthInMilliseconds(),
        bitrate: pw.bitrate(),
        sampleRate: pw.sampleRate(),
        channels: pw.channels(),
        bitsPerSample: pw.bitsPerSample(),
        codec: pw.codec() || "unknown",
        containerFormat,
        isLossless: pw.isLossless(),
        ...mpegVersion > 0 ? { mpegVersion, mpegLayer: pw.mpegLayer() } : {},
        ...containerFormat === "MP4" || containerFormat === "ASF" ? { isEncrypted: pw.isEncrypted() } : {},
        ...formatVersion > 0 ? { formatVersion } : {}
      };
    }
  };
  return new Proxy(raw, {
    get(target, prop, receiver) {
      if (prop in overrides) return overrides[prop];
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    }
  });
}
var init_embind_adapter = __esm({
  "src/taglib/embind-adapter.ts"() {
    "use strict";
  }
});

// src/taglib/audio-file-impl.ts
function readFileSync(path) {
  if (typeof Deno !== "undefined") return Deno.readFileSync(path);
  if (_nodeFs === void 0) {
    try {
      _nodeFs = new Function("return require('node:fs')")();
    } catch {
      _nodeFs = null;
    }
  }
  if (_nodeFs) return new Uint8Array(_nodeFs.readFileSync(path));
  return new Uint8Array(0);
}
var _nodeFs, AudioFileImpl;
var init_audio_file_impl = __esm({
  "src/taglib/audio-file-impl.ts"() {
    "use strict";
    init_types2();
    init_errors2();
    init_file();
    init_write();
    init_audio_file_base();
    init_embind_adapter();
    AudioFileImpl = class extends BaseAudioFileImpl {
      constructor(module, fileHandle, sourcePath, originalSource, isPartiallyLoaded = false, partialLoadOptions) {
        super(
          module,
          fileHandle,
          sourcePath,
          originalSource,
          isPartiallyLoaded,
          partialLoadOptions
        );
        __publicField(this, "pathModeBuffer", null);
      }
      save() {
        if (this.isPartiallyLoaded && this.originalSource) {
          throw new FileOperationError(
            "save",
            "Cannot save partially loaded file directly. Use saveToFile() instead"
          );
        }
        this.cachedAudioProperties = null;
        return this.handle.save();
      }
      getFileBuffer() {
        const buffer = this.handle.getBuffer();
        if (buffer.length > 0) return buffer;
        if (this.pathModeBuffer) return this.pathModeBuffer;
        if (this.sourcePath) {
          try {
            this.pathModeBuffer = readFileSync(this.sourcePath);
            return this.pathModeBuffer;
          } catch {
            return new Uint8Array(0);
          }
        }
        return new Uint8Array(0);
      }
      async saveToFile(path) {
        const targetPath = path ?? this.sourcePath;
        if (!targetPath) {
          throw new FileOperationError(
            "save",
            "No file path available. Provide a path or open the file from a path"
          );
        }
        if (this.isPartiallyLoaded && this.originalSource) {
          const rawFullHandle = this.module.createFileHandle();
          const fullFileHandle = this.module.isWasi ? rawFullHandle : wrapEmbindHandle(rawFullHandle);
          try {
            const success = await (async () => {
              const data = await readFileData(this.originalSource);
              return fullFileHandle.loadFromBuffer(data);
            })();
            if (!success) {
              throw new InvalidFormatError(
                "Failed to load full audio file for saving"
              );
            }
            fullFileHandle.setTagData(this.handle.getTagData());
            fullFileHandle.setProperties(this.handle.getProperties());
            fullFileHandle.setPictures(this.handle.getPictures());
            if (!fullFileHandle.save()) {
              throw new FileOperationError(
                "save",
                "Failed to save changes to full file"
              );
            }
            const buffer = fullFileHandle.getBuffer();
            await writeFileData(targetPath, buffer);
          } finally {
            fullFileHandle.destroy();
          }
          this.isPartiallyLoaded = false;
          this.originalSource = void 0;
        } else {
          if (!this.save()) {
            throw new FileOperationError(
              "save",
              "Failed to save changes to in-memory buffer"
            );
          }
          const buffer = this.handle.getBuffer();
          if (buffer.length > 0) {
            await writeFileData(targetPath, buffer);
          }
        }
      }
      getPictures() {
        const picturesArray = this.handle.getPictures();
        return picturesArray.map((pic) => ({
          mimeType: pic.mimeType,
          data: pic.data,
          type: PICTURE_TYPE_NAMES[pic.type] ?? "Other",
          description: pic.description
        }));
      }
      setPictures(pictures) {
        this.handle.setPictures(pictures.map((pic) => ({
          mimeType: pic.mimeType,
          data: pic.data,
          type: PICTURE_TYPE_VALUES[pic.type] ?? 0,
          description: pic.description ?? ""
        })));
      }
      addPicture(picture) {
        this.handle.addPicture({
          mimeType: picture.mimeType,
          data: picture.data,
          type: PICTURE_TYPE_VALUES[picture.type] ?? 0,
          description: picture.description ?? ""
        });
      }
      removePictures() {
        this.handle.removePictures();
      }
      getRatings() {
        return this.handle.getRatings().map(
          (r) => ({
            rating: r.rating,
            email: r.email || void 0,
            counter: r.counter || void 0
          })
        );
      }
      setRatings(ratings) {
        this.handle.setRatings(ratings.map((r) => ({
          rating: r.rating,
          email: r.email ?? "",
          counter: r.counter ?? 0
        })));
      }
      getRating() {
        const ratings = this.getRatings();
        return ratings.length > 0 ? ratings[0].rating : void 0;
      }
      setRating(rating, email) {
        this.setRatings([{ rating, email, counter: 0 }]);
      }
    };
  }
});

// src/taglib/load-audio-data.ts
async function loadAudioData(input, opts) {
  if (opts.partial && typeof File !== "undefined" && input instanceof File) {
    const headerSize = Math.min(opts.maxHeaderSize, input.size);
    const footerSize = Math.min(opts.maxFooterSize, input.size);
    if (input.size <= headerSize + footerSize) {
      return { data: await readFileData(input), isPartiallyLoaded: false };
    }
    const header = await input.slice(0, headerSize).arrayBuffer();
    const footerStart = Math.max(0, input.size - footerSize);
    const footer = await input.slice(footerStart).arrayBuffer();
    const combined = new Uint8Array(header.byteLength + footer.byteLength);
    combined.set(new Uint8Array(header), 0);
    combined.set(new Uint8Array(footer), header.byteLength);
    return { data: combined, isPartiallyLoaded: true };
  }
  if (opts.partial && typeof input === "string") {
    const fileSize = await getFileSize(input);
    if (fileSize > opts.maxHeaderSize + opts.maxFooterSize) {
      const data = await readPartialFileData(
        input,
        opts.maxHeaderSize,
        opts.maxFooterSize
      );
      return { data, isPartiallyLoaded: true };
    }
    return { data: await readFileData(input), isPartiallyLoaded: false };
  }
  return { data: await readFileData(input), isPartiallyLoaded: false };
}
var init_load_audio_data = __esm({
  "src/taglib/load-audio-data.ts"() {
    "use strict";
    init_file();
  }
});

// src/utils/tag-mapping.ts
function parseNumeric(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? void 0 : parsed;
}
function mapPropertiesToExtendedTag(props) {
  const tag = {};
  for (const [propKey, tagField] of Object.entries(BASIC_PROPERTY_KEYS)) {
    const values = props[propKey];
    if (!values || values.length === 0) continue;
    if (tagField === "year" || tagField === "track") {
      const num = parseNumeric(values[0]);
      if (num !== void 0) tag[tagField] = num;
    } else {
      tag[tagField] = values;
    }
  }
  for (const [key, values] of Object.entries(props)) {
    if (BASIC_PROPERTY_KEYS[key]) continue;
    if (!values || values.length === 0) continue;
    const camelKey = fromTagLibKey(key);
    if (NUMERIC_FIELDS.has(camelKey)) {
      const num = parseNumeric(values[0]);
      if (num !== void 0) tag[camelKey] = num;
    } else if (camelKey === "compilation") {
      tag[camelKey] = values[0] === "1";
    } else {
      tag[camelKey] = values;
    }
  }
  return tag;
}
function mergeTagUpdates(file, tags) {
  const currentProps = file.properties();
  const newProps = normalizeTagInput(tags);
  file.setProperties({ ...currentProps, ...newProps });
}
function normalizeTagInput(input) {
  const props = {};
  for (const field of [
    "title",
    "artist",
    "album",
    "comment",
    "genre"
  ]) {
    const val = input[field];
    if (val === void 0) continue;
    props[field] = Array.isArray(val) ? val : [val];
  }
  if (input.year !== void 0) {
    props.date = [String(input.year)];
  }
  if (input.track !== void 0) {
    props.trackNumber = [String(input.track)];
  }
  for (const [field, val] of Object.entries(input)) {
    if (BASIC_FIELDS.has(field) || val === void 0) continue;
    if (field === "compilation") {
      props[field] = [val ? "1" : "0"];
    } else if (NUMERIC_FIELDS.has(field)) {
      props[field] = [String(val)];
    } else if (typeof val === "string") {
      props[field] = [val];
    } else if (Array.isArray(val)) {
      props[field] = val;
    }
  }
  return props;
}
var BASIC_PROPERTY_KEYS, BASIC_FIELDS, NUMERIC_FIELDS;
var init_tag_mapping = __esm({
  "src/utils/tag-mapping.ts"() {
    "use strict";
    init_properties();
    BASIC_PROPERTY_KEYS = {
      title: "title",
      artist: "artist",
      album: "album",
      comment: "comment",
      genre: "genre",
      date: "year",
      trackNumber: "track"
    };
    BASIC_FIELDS = /* @__PURE__ */ new Set([
      "title",
      "artist",
      "album",
      "comment",
      "genre",
      "year",
      "track"
    ]);
    NUMERIC_FIELDS = /* @__PURE__ */ new Set([
      "year",
      "track",
      "discNumber",
      "totalTracks",
      "totalDiscs",
      "bpm"
    ]);
  }
});

// src/version.ts
var VERSION;
var init_version = __esm({
  "src/version.ts"() {
    "use strict";
    VERSION = "1.1.2";
  }
});

// src/runtime/module-loader-browser.ts
var module_loader_browser_exports = {};
__export(module_loader_browser_exports, {
  loadTagLibModule: () => loadTagLibModule
});
async function loadTagLibModule(options) {
  let createTagLibModule;
  try {
    const module2 = await import("./taglib-wrapper.js");
    createTagLibModule = module2.default;
  } catch {
    try {
      const module2 = await import("./taglib-wrapper.js");
      createTagLibModule = module2.default;
    } catch {
      throw new TagLibInitializationError(
        "Could not load taglib-wrapper.js. Ensure it is co-located with the browser bundle."
      );
    }
  }
  const moduleConfig = {};
  if (options?.wasmBinary) {
    moduleConfig.wasmBinary = options.wasmBinary;
  }
  if (options?.wasmUrl) {
    moduleConfig.locateFile = (path) => {
      if (path.endsWith(".wasm")) {
        return options.wasmUrl;
      }
      return path;
    };
  } else if (!options?.wasmBinary) {
    const wasmUrl = { href: "" };
    moduleConfig.locateFile = (path) => path.endsWith(".wasm") ? wasmUrl.href : path;
  }
  const module = await createTagLibModule(moduleConfig);
  return module;
}
var init_module_loader_browser = __esm({
  "src/runtime/module-loader-browser.ts"() {
    "use strict";
    init_classes();
  }
});

// src/taglib/taglib-class.ts
function toWasiPath(osPath) {
  if (osPath.startsWith("\\\\") || osPath.startsWith("//")) {
    throw new FileOperationError(
      "read",
      `UNC paths are not supported. Path: ${osPath}`
    );
  }
  let p = osPath;
  if (!p.startsWith("/") && !/^[A-Za-z]:/.test(p)) {
    const g = globalThis;
    const cwd = typeof Deno !== "undefined" ? Deno.cwd() : g.process?.cwd?.();
    if (cwd) {
      p = cwd.replace(/[/\\]+$/, "") + "/" + p;
    }
  }
  p = p.replaceAll("\\", "/");
  const driveMatch = p.match(/^([A-Za-z]):\//);
  if (driveMatch) {
    p = `/${driveMatch[1].toUpperCase()}${p.slice(2)}`;
  }
  p = p.replace(/\/\.\//g, "/").replace(/\/+/g, "/");
  if (!p.startsWith("/")) p = "/" + p;
  return p;
}
async function createTagLib(module) {
  return new TagLib(module);
}
var TagLib;
var init_taglib_class = __esm({
  "src/taglib/taglib-class.ts"() {
    "use strict";
    init_audio_formats();
    init_errors2();
    init_audio_file_impl();
    init_load_audio_data();
    init_tag_mapping();
    init_errors2();
    init_version();
    init_embind_adapter();
    TagLib = class _TagLib {
      constructor(module) {
        __publicField(this, "module");
        this.module = module;
      }
      /**
       * Initialize the TagLib Wasm module and return a ready-to-use instance.
       * @param options - Wasm loading configuration (binary, URL, backend selection).
       * @returns A configured TagLib instance.
       * @throws {TagLibInitializationError} If the Wasm module fails to load.
       */
      static async initialize(options) {
        const { loadTagLibModule: loadTagLibModule2 } = await Promise.resolve().then(() => (init_module_loader_browser(), module_loader_browser_exports));
        const module = await loadTagLibModule2(options);
        return new _TagLib(module);
      }
      /**
       * Open an audio file for reading and writing metadata.
       * @param input - File path, Uint8Array, ArrayBuffer, File object, or NamedAudioInput.
       * @param options - Partial-loading options for large files.
       * @returns An AudioFile instance (use `using` for automatic cleanup).
       * @throws {TagLibInitializationError} If the module is not properly initialized.
       * @throws {InvalidFormatError} If the file is corrupted or unsupported.
       */
      async open(input, options) {
        if (!this.module.createFileHandle) {
          throw new TagLibInitializationError(
            "TagLib module not properly initialized: createFileHandle not found. Make sure the module is fully loaded before calling open."
          );
        }
        const actualInput = isNamedAudioInput(input) ? input.data : input;
        const sourcePath = typeof actualInput === "string" ? actualInput : void 0;
        if (typeof actualInput === "string" && this.module.isWasi) {
          const fileHandle2 = this.module.createFileHandle();
          try {
            const fh = fileHandle2;
            if (fh.loadFromPath) {
              const wasiPath = toWasiPath(actualInput);
              const success = fh.loadFromPath(wasiPath);
              if (!success) {
                throw new InvalidFormatError(
                  `Failed to load audio file. Path: ${actualInput}`
                );
              }
              return new AudioFileImpl(
                this.module,
                fileHandle2,
                sourcePath,
                actualInput,
                false
              );
            }
          } catch (error) {
            if (typeof fileHandle2.destroy === "function") {
              fileHandle2.destroy();
            }
            throw error;
          }
        }
        const opts = {
          partial: true,
          maxHeaderSize: 1024 * 1024,
          maxFooterSize: 128 * 1024,
          ...options
        };
        const { data: audioData, isPartiallyLoaded } = await loadAudioData(
          actualInput,
          opts
        );
        const uint8Array = actualInput instanceof Uint8Array && audioData.buffer === actualInput.buffer ? new Uint8Array(
          audioData.buffer.slice(
            audioData.byteOffset,
            audioData.byteOffset + audioData.byteLength
          )
        ) : audioData;
        const rawHandle = this.module.createFileHandle();
        const fileHandle = this.module.isWasi ? rawHandle : wrapEmbindHandle(rawHandle);
        try {
          const success = fileHandle.loadFromBuffer(uint8Array);
          if (!success) {
            throw new InvalidFormatError(
              "Failed to load audio file. File may be corrupted or in an unsupported format",
              uint8Array.byteLength
            );
          }
          return new AudioFileImpl(
            this.module,
            fileHandle,
            sourcePath,
            actualInput,
            isPartiallyLoaded,
            opts
          );
        } catch (error) {
          if (typeof fileHandle.destroy === "function") {
            fileHandle.destroy();
          }
          throw error;
        }
      }
      async edit(input, fn) {
        const file = await this.open(input);
        try {
          await fn(file);
          if (typeof input === "string") {
            await file.saveToFile();
          } else {
            file.save();
            return file.getFileBuffer();
          }
        } finally {
          file.dispose();
        }
      }
      /**
       * Update tags in a file and save to disk in one operation.
       * @param path - Path to the audio file.
       * @param tags - Tag fields to update (partial update supported).
       * @throws {InvalidFormatError} If the file is corrupted or unsupported.
       * @throws {FileOperationError} If saving to disk fails.
       */
      async updateFile(path, tags) {
        const file = await this.open(path);
        try {
          mergeTagUpdates(file, tags);
          await file.saveToFile();
        } finally {
          file.dispose();
        }
      }
      /**
       * Copy an audio file to a new path with updated tags.
       * @param sourcePath - Path to the source audio file.
       * @param destPath - Destination path for the tagged copy.
       * @param tags - Tag fields to set on the copy.
       * @throws {InvalidFormatError} If the source file is corrupted or unsupported.
       * @throws {FileOperationError} If reading or writing fails.
       */
      async copyWithTags(sourcePath, destPath, tags) {
        const file = await this.open(sourcePath);
        try {
          mergeTagUpdates(file, tags);
          await file.saveToFile(destPath);
        } finally {
          file.dispose();
        }
      }
      /** Returns the taglib-wasm version with embedded TagLib version. */
      version() {
        return `${VERSION} (TagLib ${this.taglibVersion()})`;
      }
      taglibVersion() {
        if (this.module.getVersion) {
          return this.module.getVersion();
        }
        if (this.module.version) {
          return this.module.version();
        }
        return "unknown";
      }
    };
  }
});

// src/taglib/index.ts
var init_taglib = __esm({
  "src/taglib/index.ts"() {
    "use strict";
    init_audio_file_impl();
    init_taglib_class();
    init_errors2();
  }
});

// src/taglib.ts
var taglib_exports = {};
__export(taglib_exports, {
  AudioFileImpl: () => AudioFileImpl,
  EnvironmentError: () => EnvironmentError,
  FileOperationError: () => FileOperationError,
  InvalidFormatError: () => InvalidFormatError,
  MemoryError: () => MemoryError,
  MetadataError: () => MetadataError,
  SUPPORTED_FORMATS: () => SUPPORTED_FORMATS,
  TagLib: () => TagLib,
  TagLibError: () => TagLibError,
  TagLibInitializationError: () => TagLibInitializationError,
  UnsupportedFormatError: () => UnsupportedFormatError,
  createTagLib: () => createTagLib,
  isEnvironmentError: () => isEnvironmentError,
  isFileOperationError: () => isFileOperationError,
  isInvalidFormatError: () => isInvalidFormatError,
  isMemoryError: () => isMemoryError,
  isMetadataError: () => isMetadataError,
  isTagLibError: () => isTagLibError,
  isUnsupportedFormatError: () => isUnsupportedFormatError
});
var init_taglib2 = __esm({
  "src/taglib.ts"() {
    "use strict";
    init_taglib();
  }
});

// index.browser.ts
init_taglib2();
init_audio_formats();
init_errors2();

// src/simple/config.ts
var cachedTagLib = null;
var bufferModeEnabled = false;
function setBufferMode(enabled) {
  bufferModeEnabled = enabled;
  cachedTagLib = null;
}
async function getTagLib() {
  if (!cachedTagLib) {
    const { TagLib: TagLib2 } = await Promise.resolve().then(() => (init_taglib2(), taglib_exports));
    const initOptions = bufferModeEnabled ? { forceWasmType: "emscripten" } : void 0;
    cachedTagLib = await TagLib2.initialize(initOptions);
  }
  return cachedTagLib;
}

// src/simple/tag-operations.ts
init_errors2();
init_tag_mapping();

// src/simple/with-audio-file.ts
init_errors2();
async function withAudioFile(file, fn, options) {
  const taglib = await getTagLib();
  const audioFile = await taglib.open(file, options);
  try {
    if (!audioFile.isValid()) {
      throw new InvalidFormatError(
        "File may be corrupted or in an unsupported format"
      );
    }
    return await fn(audioFile);
  } finally {
    audioFile.dispose();
  }
}
async function withAudioFileSave(file, fn) {
  return withAudioFile(file, (audioFile) => {
    fn(audioFile);
    if (!audioFile.save()) {
      throw new FileOperationError(
        "save",
        "Failed to save metadata changes. The file may be read-only or corrupted."
      );
    }
    return audioFile.getFileBuffer();
  }, { partial: false });
}
async function withAudioFileSaveToFile(file, fn) {
  return withAudioFile(file, async (audioFile) => {
    fn(audioFile);
    await audioFile.saveToFile(file);
  });
}

// src/simple/tag-operations.ts
async function readTags(file) {
  return withAudioFile(
    file,
    (audioFile) => mapPropertiesToExtendedTag(audioFile.properties())
  );
}
async function applyTags(file, tags) {
  return withAudioFileSave(file, (audioFile) => {
    mergeTagUpdates(audioFile, tags);
  });
}
async function applyTagsToFile(file, tags) {
  if (typeof file !== "string") {
    throw new FileOperationError(
      "save",
      "applyTagsToFile requires a file path string to save changes"
    );
  }
  await withAudioFileSaveToFile(file, (audioFile) => {
    mergeTagUpdates(audioFile, tags);
  });
}
async function readProperties(file) {
  return withAudioFile(file, (audioFile) => {
    const props = audioFile.audioProperties();
    if (!props) {
      throw new MetadataError(
        "read",
        "File may not contain valid audio data",
        "audioProperties"
      );
    }
    return props;
  });
}
async function isValidAudioFile(file) {
  try {
    const taglib = await getTagLib();
    const audioFile = await taglib.open(file);
    try {
      return audioFile.isValid();
    } finally {
      audioFile.dispose();
    }
  } catch {
    return false;
  }
}
async function readFormat(file) {
  const taglib = await getTagLib();
  const audioFile = await taglib.open(file);
  try {
    if (!audioFile.isValid()) {
      return void 0;
    }
    return audioFile.getFormat();
  } finally {
    audioFile.dispose();
  }
}
async function clearTags(file) {
  return withAudioFileSave(file, (audioFile) => {
    audioFile.setProperties({});
    audioFile.removePictures();
  });
}

// src/simple/picture-operations.ts
async function readPictures(file) {
  return withAudioFile(file, (audioFile) => audioFile.getPictures());
}
async function applyPictures(file, pictures) {
  return withAudioFileSave(file, (audioFile) => {
    audioFile.setPictures(pictures);
  });
}
async function addPicture(file, picture) {
  return withAudioFileSave(file, (audioFile) => {
    audioFile.addPicture(picture);
  });
}
async function clearPictures(file) {
  return applyPictures(file, []);
}
async function readCoverArt(file) {
  const pictures = await readPictures(file);
  if (pictures.length === 0) {
    return void 0;
  }
  const frontCover = pictures.find((pic) => pic.type === "FrontCover");
  if (frontCover) {
    return frontCover.data;
  }
  return pictures[0].data;
}
async function applyCoverArt(file, imageData, mimeType) {
  const picture = {
    mimeType,
    data: imageData,
    type: "FrontCover",
    description: "Front Cover"
  };
  return applyPictures(file, [picture]);
}
function findPictureByType(pictures, type) {
  return pictures.find((pic) => pic.type === type);
}
async function replacePictureByType(file, newPicture) {
  const pictures = await readPictures(file);
  const filteredPictures = pictures.filter(
    (pic) => pic.type !== newPicture.type
  );
  filteredPictures.push(newPicture);
  return applyPictures(file, filteredPictures);
}
async function readPictureMetadata(file) {
  const pictures = await readPictures(file);
  return pictures.map((pic) => ({
    type: pic.type,
    mimeType: pic.mimeType,
    description: pic.description,
    size: pic.data.length
  }));
}

// src/simple/batch-operations.ts
init_audio_formats();
init_errors2();
init_tag_mapping();
async function executeBatch(files, options, processor) {
  if (files.length === 0) return { items: [], duration: 0 };
  const startTime = Date.now();
  const { concurrency = 4, continueOnError = true, onProgress, signal } = options;
  const items = new Array(files.length);
  const taglib = await getTagLib();
  let processed = 0;
  const total = files.length;
  for (let i = 0; i < files.length; i += concurrency) {
    signal?.throwIfAborted();
    const chunk = files.slice(i, i + concurrency);
    const chunkPromises = chunk.map(async (file, idx) => {
      const index = i + idx;
      const fileName = typeof file === "string" ? file : file instanceof File ? file.name : isNamedAudioInput(file) ? file.name : `buffer-${index}`;
      try {
        const audioFile = await taglib.open(file);
        try {
          if (!audioFile.isValid()) {
            throw new InvalidFormatError(
              "File may be corrupted or in an unsupported format"
            );
          }
          items[index] = {
            status: "ok",
            path: fileName,
            data: processor(audioFile)
          };
        } finally {
          audioFile.dispose();
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        items[index] = { status: "error", path: fileName, error: err };
        if (!continueOnError) throw err;
      }
      processed++;
      onProgress?.(processed, total, fileName);
    });
    await Promise.all(chunkPromises);
  }
  return { items, duration: Date.now() - startTime };
}
async function readTagsBatch(files, options = {}) {
  return executeBatch(
    files,
    options,
    (audioFile) => mapPropertiesToExtendedTag(audioFile.properties())
  );
}
async function readPropertiesBatch(files, options = {}) {
  return executeBatch(
    files,
    options,
    (audioFile) => audioFile.audioProperties()
  );
}
function extractDynamics(audioFile) {
  const dynamics = {};
  const fields = [
    "replayGainTrackGain",
    "replayGainTrackPeak",
    "replayGainAlbumGain",
    "replayGainAlbumPeak"
  ];
  for (const field of fields) {
    const val = audioFile.getProperty(field);
    if (val) dynamics[field] = val;
  }
  let appleSoundCheck = audioFile.getProperty("appleSoundCheck");
  if (!appleSoundCheck && audioFile.isMP4()) {
    appleSoundCheck = audioFile.getMP4Item("----:com.apple.iTunes:iTunNORM");
  }
  if (appleSoundCheck) dynamics.appleSoundCheck = appleSoundCheck;
  return Object.keys(dynamics).length > 0 ? dynamics : void 0;
}
async function readMetadata(file) {
  const taglib = await getTagLib();
  const audioFile = await taglib.open(file);
  try {
    if (!audioFile.isValid()) {
      let name;
      if (typeof file === "string") {
        name = file;
      } else if (file instanceof File) {
        name = file.name;
      } else if (isNamedAudioInput(file)) {
        name = file.name;
      } else {
        name = `buffer (${file.byteLength} bytes)`;
      }
      throw new InvalidFormatError(
        `File may be corrupted or in an unsupported format. File: ${name}`
      );
    }
    return {
      tags: mapPropertiesToExtendedTag(audioFile.properties()),
      properties: audioFile.audioProperties(),
      hasCoverArt: audioFile.getPictures().length > 0,
      dynamics: extractDynamics(audioFile)
    };
  } finally {
    audioFile.dispose();
  }
}
async function readMetadataBatch(files, options = {}) {
  return executeBatch(files, options, (audioFile) => ({
    tags: mapPropertiesToExtendedTag(audioFile.properties()),
    properties: audioFile.audioProperties(),
    hasCoverArt: audioFile.getPictures().length > 0,
    dynamics: extractDynamics(audioFile)
  }));
}

// src/simple/index.ts
init_types2();

// src/constants/index.ts
init_properties();

// src/constants/tags.ts
var Tags = {
  // Basic Properties
  Title: "title",
  Artist: "artist",
  Album: "album",
  Date: "date",
  TrackNumber: "trackNumber",
  Genre: "genre",
  Comment: "comment",
  // Extended Properties
  AlbumArtist: "albumArtist",
  Composer: "composer",
  Copyright: "copyright",
  EncodedBy: "encodedBy",
  DiscNumber: "discNumber",
  TotalTracks: "totalTracks",
  TotalDiscs: "totalDiscs",
  Compilation: "compilation",
  Bpm: "bpm",
  Lyricist: "lyricist",
  Conductor: "conductor",
  Remixer: "remixedBy",
  Language: "language",
  Publisher: "publisher",
  Mood: "mood",
  Media: "media",
  RadioStationOwner: "radioStationOwner",
  Producer: "producer",
  Subtitle: "subtitle",
  Label: "label",
  // Sorting Properties
  TitleSort: "titleSort",
  ArtistSort: "artistSort",
  AlbumArtistSort: "albumArtistSort",
  AlbumSort: "albumSort",
  ComposerSort: "composerSort",
  // Identifiers
  Isrc: "isrc",
  Asin: "asin",
  CatalogNumber: "catalogNumber",
  Barcode: "barcode",
  // MusicBrainz Identifiers
  MusicBrainzArtistId: "musicbrainzArtistId",
  MusicBrainzReleaseArtistId: "musicbrainzReleaseArtistId",
  MusicBrainzWorkId: "musicbrainzWorkId",
  MusicBrainzReleaseId: "musicbrainzReleaseId",
  MusicBrainzRecordingId: "musicbrainzTrackId",
  MusicBrainzTrackId: "musicbrainzTrackId",
  MusicBrainzReleaseGroupId: "musicbrainzReleaseGroupId",
  MusicBrainzReleaseTrackId: "musicbrainzReleaseTrackId",
  // AcoustID
  AcoustidFingerprint: "acoustidFingerprint",
  AcoustidId: "acoustidId",
  // Podcast Properties
  PodcastId: "podcastId",
  PodcastUrl: "podcastUrl",
  // Grouping and Work
  Grouping: "grouping",
  Work: "work",
  // Additional Metadata
  Lyrics: "lyrics",
  AlbumGain: "replayGainAlbumGain",
  AlbumPeak: "replayGainAlbumPeak",
  TrackGain: "replayGainTrackGain",
  TrackPeak: "replayGainTrackPeak",
  // Original release
  OriginalArtist: "originalArtist",
  OriginalAlbum: "originalAlbum",
  OriginalDate: "originalDate",
  // Miscellaneous
  Script: "script",
  InvolvedPeople: "involvedPeople",
  Encoding: "encoding"
};
function isValidTagName(name) {
  return Object.values(Tags).includes(name);
}
function getAllTagNames() {
  return Object.values(Tags);
}

// src/constants/format-mappings.ts
var FormatMappings = {
  Title: {
    id3v2: "TIT2",
    mp4: "\xA9nam",
    vorbis: "TITLE",
    ape: "Title",
    riff: "INAM"
  },
  Artist: {
    id3v2: "TPE1",
    mp4: "\xA9ART",
    vorbis: "ARTIST",
    ape: "Artist",
    riff: "IART"
  },
  Album: {
    id3v2: "TALB",
    mp4: "\xA9alb",
    vorbis: "ALBUM",
    ape: "Album",
    riff: "IPRD"
  },
  Date: {
    id3v2: "TDRC",
    mp4: "\xA9day",
    vorbis: "DATE",
    ape: "Year",
    riff: "ICRD"
  },
  Genre: {
    id3v2: "TCON",
    mp4: "\xA9gen",
    vorbis: "GENRE",
    ape: "Genre",
    riff: "IGNR"
  },
  Comment: {
    id3v2: "COMM",
    mp4: "\xA9cmt",
    vorbis: "COMMENT",
    ape: "Comment",
    riff: "ICMT"
  },
  TrackNumber: {
    id3v2: "TRCK",
    mp4: "trkn",
    vorbis: "TRACKNUMBER",
    ape: "Track",
    riff: "ITRK"
  }
};

// src/constants/utilities.ts
init_properties();
function isValidProperty(key) {
  return key in PROPERTIES;
}
function getPropertyMetadata(key) {
  return PROPERTIES[key];
}
function getAllPropertyKeys() {
  return Object.keys(PROPERTIES);
}
function getAllProperties() {
  return Object.entries(PROPERTIES);
}
function getPropertiesByFormat(format) {
  return getAllPropertyKeys().filter(
    (key) => PROPERTIES[key].supportedFormats.includes(format)
  );
}

// src/constants/complex-properties.ts
var COMPLEX_PROPERTIES = {
  PICTURE: {
    key: "PICTURE",
    description: "Embedded album art or images",
    type: "binary",
    supportedFormats: ["ID3v2", "MP4", "Vorbis", "FLAC"],
    mappings: {
      id3v2: { frame: "APIC" },
      mp4: "covr",
      vorbis: "METADATA_BLOCK_PICTURE",
      flac: "PICTURE"
    }
  },
  RATING: {
    key: "RATING",
    description: "Track rating (normalized 0.0-1.0)",
    type: "object",
    supportedFormats: ["ID3v2", "Vorbis", "MP4"],
    mappings: {
      id3v2: { frame: "POPM" },
      vorbis: "RATING",
      mp4: "----:com.apple.iTunes:RATING"
    }
  },
  LYRICS: {
    key: "LYRICS",
    description: "Unsynchronized lyrics text",
    type: "object",
    supportedFormats: ["ID3v2", "Vorbis", "MP4"],
    mappings: {
      id3v2: { frame: "USLT" },
      vorbis: "LYRICS",
      mp4: "\xA9lyr"
    }
  },
  CHAPTER: {
    key: "CHAPTER",
    description: "Chapter markers with time ranges",
    type: "object",
    supportedFormats: ["ID3v2"],
    mappings: {
      id3v2: { frame: "CHAP" }
    }
  }
};
var COMPLEX_PROPERTY_KEY = {
  PICTURE: "PICTURE",
  RATING: "RATING",
  LYRICS: "LYRICS",
  CHAPTER: "CHAPTER"
};

// src/web-utils/data-url.ts
init_classes();
function pictureToDataURL(picture) {
  let binary = "";
  for (const byte of picture.data) {
    binary += String.fromCodePoint(byte);
  }
  const base64 = btoa(binary);
  return `data:${picture.mimeType};base64,${base64}`;
}
function dataURLToPicture(dataURL, type = "FrontCover", description) {
  const regex = /^data:([^;]+);base64,(.+)$/;
  const matches = regex.exec(dataURL);
  if (!matches) {
    throw new InvalidFormatError("Invalid data URL format");
  }
  const [, mimeType, base64] = matches;
  const binaryString = atob(base64);
  const data = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    data[i] = binaryString.codePointAt(i);
  }
  return {
    mimeType,
    data,
    type,
    description
  };
}

// src/web-utils/canvas.ts
async function setCoverArtFromCanvas(file, canvas, options = {}) {
  const {
    format = "image/jpeg",
    quality = 0.92,
    type = "FrontCover",
    description = "Front Cover"
  } = options;
  const dataURL = canvas.toDataURL(format, quality);
  const picture = dataURLToPicture(dataURL, type, description);
  return applyPictures(file, [picture]);
}
async function canvasToPicture(canvas, options = {}) {
  const {
    format = "image/jpeg",
    quality = 0.92,
    type = "FrontCover",
    description
  } = options;
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to convert canvas to blob"));
          return;
        }
        blob.arrayBuffer().then(
          (arrayBuffer) => {
            const data = new Uint8Array(arrayBuffer);
            resolve({ mimeType: format, data, type, description });
          },
          reject
        );
      },
      format,
      quality
    );
  });
}
async function imageFileToPicture(file, type = "FrontCover", description) {
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  return {
    mimeType: file.type,
    data,
    type,
    description: description ?? file.name
  };
}

// src/web-utils/dom-integration.ts
function ensureArrayBufferBacked(data) {
  if (data.buffer instanceof ArrayBuffer) {
    return data;
  }
  const copy = new Uint8Array(data.length);
  copy.set(data);
  return copy;
}
function displayPicture(picture, imgElement) {
  if (imgElement.src.startsWith("blob:")) {
    URL.revokeObjectURL(imgElement.src);
  }
  const data = ensureArrayBufferBacked(picture.data);
  const blob = new Blob([data], { type: picture.mimeType });
  const objectURL = URL.createObjectURL(blob);
  imgElement.src = objectURL;
  imgElement.addEventListener("load", () => {
    setTimeout(() => URL.revokeObjectURL(objectURL), 100);
  }, { once: true });
}
function createPictureDownloadURL(picture, filename = "cover") {
  const data = ensureArrayBufferBacked(picture.data);
  const blob = new Blob([data], { type: picture.mimeType });
  return URL.createObjectURL(blob);
}
async function createPictureGallery(file, container, options = {}) {
  const pictures = await readPictures(file);
  container.innerHTML = "";
  pictures.forEach((picture, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = options.className ?? "picture-item";
    const img = document.createElement("img");
    displayPicture(picture, img);
    img.alt = picture.description ?? `Picture ${index + 1}`;
    if (options.onClick) {
      img.style.cursor = "pointer";
      img.addEventListener("click", () => options.onClick(picture, index));
    }
    wrapper.appendChild(img);
    if (options.includeDescription && picture.description) {
      const caption = document.createElement("p");
      caption.textContent = picture.description;
      wrapper.appendChild(caption);
    }
    container.appendChild(wrapper);
  });
}

// index.browser.ts
init_types2();

// src/utils/rating.ts
function normalized(value) {
  return value;
}
function popm(value) {
  return value;
}
function toNormalized(value) {
  return value / 255;
}
function fromNormalized(value) {
  return Math.round(value * 255);
}
function toStars(value, maxStars = 5) {
  return Math.round(value * maxStars);
}
function fromStars(stars, maxStars = 5) {
  return stars / maxStars;
}
var POPM_STAR_VALUES = [0, 1, 64, 128, 196, 255];
function toPopm(value) {
  const stars = Math.round(value * 5);
  return POPM_STAR_VALUES[stars] ?? 0;
}
function fromPopm(value) {
  if (value === 0) return 0;
  if (value <= 1) return 0.2;
  if (value <= 64) return 0.4;
  if (value <= 128) return 0.6;
  if (value <= 196) return 0.8;
  return 1;
}
function toPercent(value) {
  return value * 100;
}
function fromPercent(percent) {
  return percent / 100;
}
function clamp(rating) {
  return Math.max(0, Math.min(1, rating));
}
function isValid(rating) {
  return typeof rating === "number" && !Number.isNaN(rating) && rating >= 0 && rating <= 1;
}
var RatingUtils = {
  normalized,
  popm,
  toNormalized,
  fromNormalized,
  toStars,
  fromStars,
  toPopm,
  fromPopm,
  toPercent,
  fromPercent,
  clamp,
  isValid,
  POPM_STAR_VALUES
};

// index.browser.ts
init_module_loader_browser();
export {
  AudioFileImpl,
  BITRATE_CONTROL_MODE_NAMES,
  BITRATE_CONTROL_MODE_VALUES,
  COMPLEX_PROPERTIES,
  COMPLEX_PROPERTY_KEY,
  EnvironmentError,
  FileOperationError,
  FormatMappings,
  InvalidFormatError,
  MemoryError,
  MetadataError,
  PICTURE_TYPE_NAMES,
  PICTURE_TYPE_VALUES,
  PROPERTIES,
  RatingUtils,
  SUPPORTED_FORMATS,
  TagLib,
  TagLibError,
  TagLibInitializationError,
  Tags,
  UnsupportedFormatError,
  addPicture,
  applyCoverArt,
  applyPictures,
  applyTags,
  applyTagsToFile,
  canvasToPicture,
  clearPictures,
  clearTags,
  createPictureDownloadURL,
  createPictureGallery,
  createTagLib,
  dataURLToPicture,
  displayPicture,
  findPictureByType,
  getAllProperties,
  getAllPropertyKeys,
  getAllTagNames,
  getPropertiesByFormat,
  getPropertyMetadata,
  imageFileToPicture,
  isEnvironmentError,
  isFileOperationError,
  isInvalidFormatError,
  isMemoryError,
  isMetadataError,
  isNamedAudioInput,
  isTagLibError,
  isUnsupportedFormatError,
  isValidAudioFile,
  isValidProperty,
  isValidTagName,
  loadTagLibModule,
  pictureToDataURL,
  readCoverArt,
  readFormat,
  readMetadata,
  readMetadataBatch,
  readPictureMetadata,
  readPictures,
  readProperties,
  readPropertiesBatch,
  readTags,
  readTagsBatch,
  replacePictureByType,
  setBufferMode,
  setCoverArtFromCanvas
};
