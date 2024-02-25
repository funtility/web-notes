//#region File Menu

document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("main-menu-button")
    .addEventListener("click", function () {
      document.getElementById("main-menu-dropdown").classList.toggle("hidden");
    });

  window.addEventListener("click", function (event) {
    if (!event.target.matches("#file-menu-button")) {
      var dropdowns = document.getElementsByClassName("dropdown-content");
      for (var i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (!openDropdown.classList.contains("hidden")) {
          openDropdown.classList.add("hidden");
        }
      }
    }
  });

  // document
  //   .getElementById("capture-element")
  //   .addEventListener("click", function () {
  //     chrome.tabs.query({ active: true }, function (tabs) {
  //       chrome.tabs.sendMessage(tabs[0].id, { type: "captureClick" });
  //       window.close();
  //     });
  //   });

  // document
  //   .getElementById("download-captures")
  //   .addEventListener("click", function () {
  //     chrome.runtime.sendMessage({ type: "downloadCaptures" });
  //   });
});

//#endregion

//#region Tab Listeners

let tabView = new TabView();

/**
 * Listens for when a tab is activated.
 * This is for new tabs and when the user switches tabs.
 */
chrome.tabs.onActivated.addListener(function (activeInfo) {
  activeTabId = activeInfo.tabId;
  chrome.tabs.get(activeInfo.tabId, async function (tab) {
    if (tab.url) {
      await processTab(tab);
    }
  });
});

/**
 * This is for when the URL of a tab is changed.
 * E.G. A refresh or a new URL (such as search result is loaded) is entered.
 */
chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  activeTabId = tabId;
  // If the tab's URL has been updated
  if (changeInfo.url) {
    await processTab(tab);
  }
});

//#endregion

//#region TabView

async function processTab(tab) {
  console.log("processTab", tab);
  const tabInfo = new TabInfo().fromTab(tab);
  if (tabInfo.isNotRestricted) {
    await updateTabView(tabInfo);
  } else {
    tabView = new TabView("(No Domain)");
  }
  document.title = `Notes: ${tabView.domain}`;
  updateTabViewComponent();
}

async function updateTabView(tabInfo) {
  console.log("updateTabView", tabInfo);
  tabView = new TabView(tabInfo.domain);
  await getRecordSetViews(tabInfo);
  if (tabView.recordSetViews.length > 0) {
    await getRecordSetViewRecords();
  }
}

async function getRecordSetViews(tabInfo) {
  await getRecordSetsByDomain(tabInfo.domain).then((recordSets) => {
    // console.log("records", records);
    tabView.recordSetViews = recordSets.map((r) => new RecordSetView(r));
  });
}

async function getRecordSetsByDomain(domain) {
  return new Promise((resolve, reject) => {
    dbContext.getRecordSetsByDomain(domain, (records) => {
      resolve(records);
    });
  });
}

async function getRecordSetViewRecords() {
  await Promise.all(
    tabView.recordSetViews.map(async (recordView) => {
      recordView.records = await getRecordsByRecordSetId(
        recordView.recordSet.id
      );
    })
  );
}

async function getRecordsByRecordSetId(recordSetId) {
  return new Promise((resolve, reject) => {
    dbContext.getRecordsByRecordSetId(recordSetId, (records) => {
      resolve(records);
    });
  });
}

function updateTabViewComponent() {
  let content = document.getElementById("content");
  content.innerHTML = null;
  content.appendChild(new TabViewComponent(tabView).element);
}

//#endregion

class TabViewComponent {
  /**
   * Create an instance of the TabViewComponent.
   * @param {TabView} view
   */
  constructor(view) {
    this.tabView = view;
  }

  get element() {
    let ele = document.createElement("div");
    ele.classList.add("tab-view");
    ele.appendChild(this.recordSetViews);
    return ele;
  }

  get recordSetViews() {
    console.log("recordSetViews");
    const recordSetViews = document.createElement("div");
    recordSetViews.appendChild(this.newRecordSetInput());
    recordSetViews.classList.add("recordset-views");
    // this.tabView.recordSetViews.forEach((recordSetView) => {
    //   recordSetViews.appendChild(
    //     new RecordSetViewComponent(recordSetView).element
    //   );
    // });
    return recordSetViews;
  }

  newRecordSetInput() {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder =
      "Enter a title to add a new notepad for: " + this.tabView.domain;
    input.dataset.domain = this.tabView.domain;
    input.addEventListener("blur", function () {
      console.log("blur", this.value);
      // save the new record set
      dbContext.addRecordSet(
        new RecordSet({
          title: this.value,
          domain: this.dataset.domain,
        })
      );
    });
    input.addEventListener("keyup", function (event) {
      if (event.key === "Enter") {
        console.log("enter");
        // save the new record set
        // swap this element with a header
      }
      if (event.key === "Escape") {
        console.log("escape");
        // cancel the edit
        // remove this element
      }
    });
    return input;
  }
}

class RecordSetViewComponent {
  /**
   * Create an instance of the RecordSetViewComponent.
   * @param {RecordSetView} recordSetView
   */
  constructor(recordSetView) {
    this.recordSetView = recordSetView;
  }

  get element() {
    //create an accordion container
    const accordion = document.createElement("div");
    accordion.classList.add("accordion");
    accordion.dataset.recordSet = JSON.stringify(this.recordSetView.recordSet);
    accordion.appendChild(this.header);
    accordion.appendChild(this.records);
    return accordion;
  }

  //the accordion is the header and the records
  //the header is a button that when clicked expands the records
  //the records are hidden by default
  //the header should be the title of the record set
  get header() {
    const header = document.createElement("button");
    header.classList.add("header");
    header.textContent = this.recordSetView.recordSet.title;
    header.dataset.recordSet = JSON.stringify(this.recordSetView.recordSet);

    header.addEventListener("click", function () {
      document.querySelectorAll(".accordion").forEach((ele) => {
        ele.classList.remove("active");
        let data = JSON.parse(ele.querySelector(".header").dataset.recordSet);
        if (data.isFocused) {
          data.isFocused = false;
          dbContext.updateRecordSet(data);
        }
      });

      this.classList.toggle("active");
      this.recordSetView.recordSet.isFocused =
        !this.recordSetView.recordSet.isFocused;
      dbContext.updateRecordSet(this.recordSetView.recordSet);

      const panel = this.nextElementSibling;
      if (panel.style.maxHeight) {
        panel.style.maxHeight = null;
      } else {
        panel.style.maxHeight = panel.scrollHeight + "px";
      }
    });

    return header;
  }

  // the records are a list of record views
  get records() {
    const records = document.createElement("div");
    records.classList.add("records");
    this.recordSetView.records.forEach((record) => {
      records.appendChild(new RecordViewComponent(record).element);
    });
    return records;
  }
}

class RecordViewComponent {
  /**
   * Create an instance of the RecordViewComponent.
   * @param {Record} record
   */
  constructor(record) {
    this.record = record;
  }

  get element() {
    const ele = document.createElement("div");
    ele.classList.add("record-view");
    ele.appendChild(this.key);
    ele.appendChild(this.value);
    return ele;
  }

  get key() {
    const key = document.createElement("div");
    key.classList.add("key");
    key.textContent = this.record.key;
    //the key should have a button to edit the record
    //the key should have a button to delete the record
    return key;
  }

  get value() {
    const value = document.createElement("div");
    value.classList.add("value");
    value.textContent = this.record.value;
    return value;
  }
}
