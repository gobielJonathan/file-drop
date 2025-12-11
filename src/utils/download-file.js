export async function downloadFile(urlOrData, suggestedName) {
  let res;
  
  // Handle ArrayBuffer or Blob input
  if (urlOrData instanceof ArrayBuffer || urlOrData instanceof Blob) {
    const blob = urlOrData instanceof Blob ? urlOrData : new Blob([urlOrData]);
    res = new Response(blob);
  } else {
    // Handle URL string
    res = await fetch(urlOrData, { mode: "no-cors" });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  const isShowSaveFilePickerSupported = 'showSaveFilePicker' in window;
  if (isShowSaveFilePickerSupported) {
    const handle = await window.showSaveFilePicker({
      suggestedName,
      types: [{ description: "Any file", accept: { "*/*": [] } }],
    });
    const writable = await handle.createWritable();
    try {
      if (res.body && "pipeTo" in res.body) {
        await res.body.pipeTo(writable);
      } else {
        await writable.write(await res.blob());
        await writable.close();
      }
    } catch (err) {
      await writable.abort();
      throw err;
    }
  } else {
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = suggestedName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }
}
