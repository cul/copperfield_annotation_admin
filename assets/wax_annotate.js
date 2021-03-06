// EVENTS

$(document).ready(function() {
  $('.manifest-selector').click(function() {
    let targetManifestID    = $(this).attr('manifest');
    let availableManifests  = getLoadedManifests();
    let currentWindow       = window.viewer.workspace.windows[0];

    if (!targetManifestID.endsWith('.json'))  { targetManifestID += '.json'; }

    currentWindow.manifest = availableManifests[targetManifestID];
    currentWindow.canvasID = null;
    currentWindow.update();
  });

  $('#hide').click(function() {
    $("#gui_results").empty();
    $("#anno_results").empty();
  });

  $('#view').click(function() {
    const sumAnnotations = getLocalAnnotations();

    $('#anno_results').empty();
    $("#gui_results").empty();

    $('#anno_results').append(`<div class='anno'><textarea rows='30' cols='100' id='annotationJSON'>${JSON.stringify(sumAnnotations, null, 2)}</textarea></div>`);
    $('#gui_results').append(`<div class='anno'><ul id='annotationGUI'></ul></div>`)
    for (a in sumAnnotations) {
      $('#annotationGUI').append(`<li>${annotationToText(sumAnnotations[a])}</li>`);
    };

    $('.annotation_link').click(function() {
      let targetCanvasID      = $(this).attr('canvas');
      let targetManifestID    = $(this).attr('manifest');
      let availableManifests  = getLoadedManifests();
      let currentWindow       = window.viewer.workspace.windows[0];

      if (!targetManifestID.endsWith('.json'))  { targetManifestID += '.json'; }

      // currentWindow.manifest = availableManifests[targetManifestID];
      // currentWindow.canvasID = targetCanvasID;
      // console.log(targetCanvasID);
      // console.log(currentWindow);
      // currentWindow.update();
      // console.log(currentWindow);

      let event = 'SET_CURRENT_CANVAS_ID.' + currentWindow.id;
      window.viewer.eventEmitter.publish(event, targetCanvasID);
    });
  });

  $("#download").click(function() {
    let datetime  = currentDateString();
    let filename  = `annotations_${datetime}.json`
    let json      = JSON.stringify(getLocalAnnotations(), null, 2);

    download(filename, json);
  });
});





// FUNCTIONS

function getLoadedManifests() {
  return window.viewer.state.currentConfig.manifests;
}

function zPad(num) {
  return String(num).padStart(2, '0');
}

function currentDateString() {
  let d       = new Date();
  let year    = d.getFullYear();
  let month   = zPad(d.getMonth()+1);
  let date    = zPad(d.getDate());
  let hours   = zPad(d.getHours());
  let minutes = zPad(d.getMinutes());
  let seconds = zPad(d.getSeconds());

  return `${year}-${month}-${date}_${hours}-${minutes}-${seconds}`;
}

function annotationToText(anno) {
  let text          = [];
  let canvas        = anno['on'][0]['full'];
  let canvasName    = canvas.split('/').slice(-1).pop();
  let manifest      = anno['on'][0]['within']['@id'];
  let manifestName  = manifest.split('/').slice(-2, -1).pop();

  for (r in anno['resource']) {
    let resource = anno['resource'][r];
    if (resource['@type'] == 'dctypes:Text') {
      text.push(resource['chars'].replace(/(<([^>]+)>)/ig, ''));
    }
  }

  text = text.join(', ');
  if(text.length > 50) {
    text = `${text.substring(0,49)}...`;
  }

  return `Annotation <b>"${text}"</b> on canvas <a href='#' canvas='${canvas}' manifest='${manifest}' class='annotation_link'>#${canvasName}</a>`;
}

function download(filename, text) {
  let element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function createAnnotationAdminViewer(data, manifest=null, canvas=null) {
  opts = {
    id: 'mirador-admin-viewer',
    annotationEndpoint: {
      name: 'Local Storage',
      module: 'LocalStorageEndpoint'
    },
    mainMenuSettings: {
      show: false
    },
    data: [],
    windowObjects: [{
      loadedManifest: manifest || data[0],
      availableViews: ['ImageView', 'ThumbnailsView'],
      viewType: 'ImageView',
      annotationLayer: true,
      annotationState: true,
      displayLayout: false,
      sidePanel: false
    }]
  };

  if (canvas != null) { opts.windowObjects[0].canvasID = canvas; }
  for (d in data) { opts.data.push({ 'manifestUri': data[d] }); }
  return Mirador(opts).viewer;
}

function createZenViewer(data, manifest=null) {
  opts = {
    id: 'mirador-zen-viewer',
    mainMenuSettings: {
      show: false
    },
    annotationEndpoint: {
      name: 'Local Storage',
      module: 'LocalStorageEndpoint'
    },
    autoHideControls: true,
    data: [],
    windowObjects: [{
      loadedManifest: manifest || data[0],
      availableViews: ['ImageView', 'ThumbnailsView'],
      viewType: 'ImageView',
      displayLayout: false,
      sidePanel: false,
      annotationLayer: true,
      annotationState: true,
      annotationCreation: false,
      sidePanelVisible: false,
      bottomPanelVisible: false
    }]
  };
  for (d in data) { opts.data.push({ 'manifestUri': data[d] }); }
  return Mirador(opts).viewer;
}

function getLocalAnnotations() {
  let keys            = Object.keys(localStorage);
  let canvases        = keys.filter(function(k){ return k.startsWith('http'); });
  let sumAnnotations  = [];

  for (c in canvases) {
    var annotations = JSON.parse(localStorage[canvases[c]]);
    for (i in annotations) {
      sumAnnotations.push(annotations[i]);
    }
  }

  return sumAnnotations;
}
