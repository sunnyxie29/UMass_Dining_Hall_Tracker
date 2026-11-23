let focusedBefore = null;

document.addEventListener("htmx:beforeRequest", () => {
  focusedBefore = document.activeElement;
});

document.addEventListener("htmx:afterRequest", (event) => {
  if (document.activeElement !== document.body) return;
  if (focusedBefore?.isConnected) {
    focusedBefore.focus();
    return;
  }

  const { verb, path } = event.detail.requestConfig;

  if (verb === "put") {
    const id = path.split("/").pop();
    document.querySelector(`#item-${id} .edit-btn`)?.focus();
    return;
  }

  if (verb === "delete") {
    document.querySelector("#items").focus();
  }
});
