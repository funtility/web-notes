class TabView {
  constructor(domain) {
    this.domain = domain;
    this.recordSetViews = [];
  }
}

class RecordSetView {
  /**
   * Creates an instance of the RecordSetView.
   * @param {RecordSet} recordSet
   */
  constructor(recordSet) {
    this.recordSet = recordSet;
    this.records = [];
  }
}
