let db;

const request = window.indexedDB.open("funtility-web-notes", 1);
request.onerror = (event) => {
  db = event.target.result;
};
request.onupgradeneeded = (event) => {
  db = event.target.result;
  if (event.oldVersion < 1) {
    // RecordSet is the parent object for Records.
    const recordSetStore = db.createObjectStore("recordSet", { keyPath: "id" });
    recordSetStore.createIndex("domain", "domain", { unique: false });

    // Records are the individual data points that are collected.
    const recordStore = db.createObjectStore("records", { keyPath: "id" });
    recordStore.createIndex("recordSetId", "recordSetId", { unique: false });
  }
};
request.onsuccess = (event) => {
  db = event.target.result;
};

/**
 * A collection of functions for interacting with the IndexedDB API.
 */
window.dbContext = {
  //#region RecordSet

  /**
   * Returns a list of all RecordSet objects in the database to the onsuccess function.
   * @param {function} onsuccess The callback function.
   */
  getAllRecordSets(onsuccess) {
    const transaction = db.transaction("recordSet", "readonly");
    const recordSets = transaction.objectStore("recordSet");
    const request = recordSets.getAll();
    request.onsuccess = (event) => {
      const result = event.target.result.map((data) => new RecordSets(data));
      onsuccess(result);
    };
  },

  /**
   * Returns a list of all RecordSet objects in the database to the onsuccess function.
   * @param {string} domain The domain to get RecordSets for.
   * @param {function} onsuccess The callback function.
   */
  getRecordSetsByDomain(domain, onsuccess = () => {}) {
    const transaction = db.transaction("recordSet", "readonly");
    const recordSets = transaction.objectStore("recordSet");
    const domainIndex = recordSets.index("domain");
    const request = domainIndex.getAll(domain);
    request.onsuccess = (event) => {
      const result = event.target.result.map((data) => new RecordSet(data));
      onsuccess(result);
    };
  },

  addRecordSetWithFocus(recordSet, onsuccess = () => {}) {
    recordSet.isFocused = true;
    dbContext.addRecordSet(recordSet, (recordSet) => {
      dbContext.setRecordSetFocus(recordSet.domain, recordSet.id, onsuccess);
    });
  },

  setRecordSetFocus(domain, recordSetId, onsuccess = () => {}) {
    dbContext.getRecordSetsByDomain(domain, (records) => {
      const updatedRecords = records.map((set) => {
        return {
          ...set,
          isFocused: set.id === recordSetId,
        };
      });
      dbContext.bulkUpdateRecordSets(updatedRecords, onsuccess);
    });
  },

  /**
   * Adds a RecordSet object to the database.
   * @param {RecordSet} recordSet The object to add to the database.
   * @param {function} onsuccess The function to call when the file is added.
   */
  addRecordSet(recordSet, onsuccess = () => {}) {
    const transaction = db.transaction("recordSet", "readwrite");
    const recordSets = transaction.objectStore("recordSet");
    const request = recordSets.add(recordSet);
    request.onsuccess = (event) => {
      // Get the ID of the added recordSet
      const id = event.target.result;
      // Add the ID to the recordSet object
      recordSet.id = id;
      // Call the onsuccess function with the recordSet object
      onsuccess(recordSet);
    };
  },

  /**
   * Updates an exsiting RecordSet in the database.
   * @param {RecordSet} recordSet The object to update.
   * @param {function} onsuccess The function to call when the file is updated.
   */
  updateRecordSet(recordSet, onsuccess = () => {}) {
    const transaction = db.transaction("recordSet", "readwrite");
    const recordSets = transaction.objectStore("recordSet");
    const request = recordSets.put(recordSet);
    request.onsuccess = (event) => {
      onsuccess(event.target.result);
    };
  },

  bulkUpdateRecordSets(recordSets, onsuccess = () => {}) {
    console.log("bulk update record sets", recordSets);
    const transaction = db.transaction("recordSet", "readwrite");
    const store = transaction.objectStore("recordSet");

    recordSets.forEach((recordSet) => {
      store.put(recordSet);
    });

    transaction.oncomplete = function (event) {
      console.log("Transaction completed: ", event);
      onsuccess(event);
    };

    transaction.onerror = function (event) {
      console.error("Transaction failed: ", event.target.error);
    };
  },

  //#endregion RecordSet

  //#region Records

  /**
   * Returns a list of distinct keys from all of the Records in the database to the onsuccess function.
   */
  getAllRecordKeys(onsuccess) {
    const transaction = db.transaction("records", "readonly");
    const records = transaction.objectStore("records");
    const request = records.getAll();
    request.onsuccess = (event) => {
      const result = event.target.result.map((data) => data.key);
      onsuccess([...new Set(result)]);
    };
  },

  /**
   * Returns a list of all the Records to the onsuccess function.
   * @param {function} onsuccess The function to call when the Records are retrieved.
   * The Records retrieved are passed to this function.
   */
  getAllRecords(onsuccess) {
    const transaction = db.transaction("records", "readonly");
    const records = transaction.objectStore("records");
    const request = records.getAll();
    request.onsuccess = (event) => {
      const result = event.target.result.map((data) => new Record(data));
      onsuccess(result);
    };
  },

  /**
   * Returns a list of all the Records for a given Target to the onsuccess function.
   * @param {string} recordSetId The id of the RecordSet to get Records for.
   * @param {function} onsuccess The function to call when the Records are retrieved.
   * The Records retrieved are passed to this function.
   */
  getRecordsByRecordSetId(recordSetId, onsuccess = () => {}) {
    const transaction = db.transaction("records", "readonly");
    const records = transaction.objectStore("records");
    const recordSetIndex = records.index("recordSetId");
    const request = recordSetIndex.getAll(recordSetId);
    request.onsuccess = (event) => {
      const result = event.target.result.map((data) => new Record(data));
      onsuccess(result);
    };
  },

  /**
   * Adds a Record object to the database.
   * @param {Record} record The record to add.
   * @param {function} onsuccess The function to call when the record is saved.
   * The result of the call is passed to this function.
   */
  addRecord(record, onsuccess = () => {}) {
    const transaction = db.transaction("records", "readwrite");
    const records = transaction.objectStore("records");
    const request = records.add(record);
    request.onsuccess = (event) => {
      onsuccess(event.target.result);
    };
  },

  /**
   * Updates an exsiting Record in the database.
   * @param {Record} record The validation range to update.
   * @param {function} onsuccess The function to call when the range is updated.
   * The result of the call is passed to this function.
   */
  updateRecord(record, onsuccess = () => {}) {
    const transaction = db.transaction("records", "readwrite");
    const records = transaction.objectStore("records");
    const request = records.put(record);
    request.onsuccess = (event) => {
      onsuccess(event.target.result);
    };
  },

  /**
   * Deletes all Records for a given Target.
   * @param {string} recordSetId The id of the Target that the Records belong to.
   * @param {function} onsuccess The function to call when the records are deleted.
   */
  deleteRecordsBySetId(recordSetId, onsuccess = () => {}) {
    const transaction = db.transaction("records", "readwrite");
    const records = transaction.objectStore("records");
    const recordSetIndex = records.index("recordSetId");
    const destroy = recordSetIndex.openKeyCursor(IDBKeyRange.only(recordSetId));
    destroy.onsuccess = (event) => {
      let cursor = event.target.result;
      if (cursor) {
        let deleteRequest = records.delete(cursor.primaryKey);
        deleteRequest.onsuccess = (event) => {
          cursor.continue();
        };
      }
      onsuccess(event.target.result);
    };
  },

  /**
   * Deletes an exsiting Record from the database.
   * @param {string} recordId The id of the Record to delete.
   * @param {function} onsuccess The function to call when the Record is deleted.
   */
  deleteRecord(recordId, onsuccess = () => {}) {
    const transaction = db.transaction("records", "readwrite");
    const records = transaction.objectStore("records");
    const request = records.delete(recordId);
    request.onsuccess = (event) => {
      onsuccess(event.target.result);
    };
  },

  //#endregion Records
};
