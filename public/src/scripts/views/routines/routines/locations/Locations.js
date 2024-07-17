// @filename: locations.ts
import { deleteEntity, getEntitiesData, registerEntity, updateEntity, getEntityData, getFilterEntityData, getFilterEntityCount, getUserInfo } from "../../../../endpoints.js";
import { inputObserver, inputSelect, CloseDialog, filterDataByHeaderType, pageNumbers, fillBtnPagination, currentDateTime, getDetails, equivalentTime } from "../../../../tools.js";
import { Config } from "../../../../Configs.js";
import { tableLayout } from "./Layout.js";
import { tableLayoutTemplate } from "./Template.js";
const tableRows = Config.tableRows;
const currentPage = Config.currentPage;
const customerId = localStorage.getItem('customer_id');
let infoPage = {
  count: 0,
  offset: Config.offset,
  currentPage: currentPage,
  search: ""
};
let dataPage;
let routine;
const currentBusiness = async() => {
    const currentUser = await getUserInfo();
    const userid = await getEntityData('User', `${currentUser.attributes.id}`);
    return userid;
  }
const getLocations = async (routineId) => {
    //nombre de la entidad
    /*const location = await getEntitiesData('Location');
    const FCustomer = location.filter((data) => `${data.customer?.id}` === `${customerId}`);
    return FCustomer;*/
    routine = await getEntityData("Routine", routineId)
    let raw = JSON.stringify({
      "filter": {
          "conditions": [
              {
                  "property": "customer.id",
                  "operator": "=",
                  "value": `${customerId}`
              },
              {
                "property": "routine.id",
                "operator": "=",
                "value": `${routineId}`
              },
          ],
      },
      sort: "-createdDate",
      limit: Config.tableRows,
      offset: infoPage.offset,
      fetchPlan: 'full',
  });
  if (infoPage.search != "") {
      raw = JSON.stringify({
          "filter": {
              "conditions": [
                  {
                      "group": "OR",
                      "conditions": [
                          {
                              "property": "name",
                              "operator": "contains",
                              "value": `${infoPage.search.toLowerCase()}`
                          }
                      ]
                  },
                  {
                      "property": "customer.id",
                      "operator": "=",
                      "value": `${customerId}`
                  },
                  {
                    "property": "routine.id",
                    "operator": "=",
                    "value": `${routine.id}`
                  },
              ]
          },
          sort: "-createdDate",
          limit: Config.tableRows,
          offset: infoPage.offset,
          fetchPlan: 'full',
      });
  }
  infoPage.count = await getFilterEntityCount("RoutineSchedule", raw);
  dataPage = await getFilterEntityData("RoutineSchedule", raw);
  return dataPage;
};
export class Locations {
    constructor() {
        this.dialogContainer = document.getElementById('app-dialogs');
        this.entityDialogContainer = document.getElementById('entity-editor-container');
        this.content = document.getElementById('datatable-container');
        this.searchEntity = async (tableBody /*, data*/) => {
            const search = document.getElementById('search');
            const btnSearch = document.getElementById('btnSearch');
            search.value = infoPage.search;
            await search.addEventListener('keyup', () => {
                /*const arrayData = data.filter((user) => `${user.name}`
                    .toLowerCase()
                    .includes(search.value.toLowerCase()));
                let filteredResult = arrayData.length;
                let result = arrayData;
                if (filteredResult >= tableRows)
                    filteredResult = tableRows;
                this.load(tableBody, currentPage, result);
                this.pagination(result, tableRows, currentPage);*/
            });
            btnSearch.addEventListener('click', async () => {
              new Locations().render(Config.offset, Config.currentPage, search.value.toLowerCase().trim(), routine.id);
            });
        };
    }

    async render(offset, actualPage, search, routineId) {
        infoPage.offset = offset;
        infoPage.currentPage = actualPage;
        infoPage.search = search;
        this.content.innerHTML = '';
        this.content.innerHTML = tableLayout;
        const tableBody = document.getElementById('datatable-body');
        const subtitle = document.getElementById('datatable_subtitle')  
        tableBody.innerHTML = '.Cargando...';
        let data = await getLocations(routineId);
        subtitle.innerText = `Rutina: ${routine.name}`
        tableBody.innerHTML = tableLayoutTemplate.repeat(tableRows);
        this.load(tableBody, currentPage, data);
        this.searchEntity(tableBody /*, data*/);
        new filterDataByHeaderType().filter();
        this.pagination(data, tableRows, infoPage.currentPage);
    }

    load(table, currentPage, data) {
        createRoutines('INS', routine.id, null);
        table.innerHTML = '';
        currentPage--;
        let start = tableRows * currentPage;
        let end = start + tableRows;
        let paginatedItems = data.slice(start, end);
        if (data.length === 0) {
            let mensaje = 'No existen datos';
            if(customerId == null){mensaje = 'Seleccione una empresa';}
            let row = document.createElement('tr');
            row.innerHTML = `
        <td>${mensaje}</td>
        <td></td>
        <td></td>
      `;
            table.appendChild(row);
        }
        else {
            for (let i = 0; i < paginatedItems.length; i++) {
                let location = paginatedItems[i];
                let row = document.createElement('tr');
                row.innerHTML += `
          <td>${location.name}</dt>
          <td>${location.cords}</dt>
          <td>${location.scheduleTime} - ${location.scheduleTimeEnd ?? ''}</dt>
          <td>${location?.frequency ?? 0}</dt>
          <td>${location?.distance ?? 0}</dt>
          <td class="entity_options">
          <button class="button" id="view-entity" data-entityId="${location.id}">
            <i class="fa-solid fa-clipboard-list"></i>
          </button>
          <button class="button" id="edit-entity" data-entityId="${location.id}">
            <i class="fa-solid fa-pen"></i>
          </button>
            <button class="button" id="remove-entity" data-entityId="${location.id}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </dt>
        `;
                table.appendChild(row);
            }
        }
        this.register();
        this.edit(this.entityDialogContainer, data);
        this.selectModal();
        this.remove();

    }
    pagination(items, limitRows, currentPage) {
      const tableBody = document.getElementById('datatable-body');
      const paginationWrapper = document.getElementById('pagination-container');
      paginationWrapper.innerHTML = '';
      let pageCount;
      pageCount = Math.ceil(infoPage.count / limitRows);
      let button;
      if (pageCount <= Config.maxLimitPage) {
        for (let i = 1; i < pageCount + 1; i++) {
            button = setupButtons(i /*, items, currentPage, tableBody, limitRows*/);
            paginationWrapper.appendChild(button);
        }
        fillBtnPagination(currentPage, Config.colorPagination);
        }
      else {
          pagesOptions(items, currentPage);
      }
        function setupButtons(page /*, items, currentPage, tableBody, limitRows*/) {
            const button = document.createElement('button');
            button.classList.add('pagination_button');
            button.setAttribute("name", "pagination-button");
            button.setAttribute("id", "btnPag" + page);
            button.innerText = page;
            button.addEventListener('click', () => {
                currentPage = page;
                new Locations().render(infoPage.offset, currentPage, infoPage.search, routine.id);
            });
            return button;
        }
        function pagesOptions(items, currentPage) {
          paginationWrapper.innerHTML = '';
          let pages = pageNumbers(items, Config.maxLimitPage, currentPage);
          const prevButton = document.createElement('button');
          prevButton.classList.add('pagination_button');
          prevButton.innerText = "<<";
          paginationWrapper.appendChild(prevButton);
          const nextButton = document.createElement('button');
          nextButton.classList.add('pagination_button');
          nextButton.innerText = ">>";
          for (let i = 0; i < pages.length; i++) {
              if (pages[i] > 0 && pages[i] <= pageCount) {
                  button = setupButtons(pages[i]);
                  paginationWrapper.appendChild(button);
              }
          }
          paginationWrapper.appendChild(nextButton);
          fillBtnPagination(currentPage, Config.colorPagination);
          setupButtonsEvents(prevButton, nextButton);
      }
      function setupButtonsEvents(prevButton, nextButton) {
          prevButton.addEventListener('click', () => {
              new Locations().render(Config.offset, Config.currentPage, infoPage.search, routine.id);
          });
          nextButton.addEventListener('click', () => {
              infoPage.offset = Config.tableRows * (pageCount - 1);
              new Locations().render(infoPage.offset, pageCount, infoPage.search, routine.id);
          });
      }
    }
    register() {
        // register entity
        const openEditor = document.getElementById('new-entity');
        openEditor.addEventListener('click', () => {
            renderInterface();
        });
        const renderInterface = async () => {
            let lat = -2.186790330550842;
            let long = -79.8948977850493;
            let zoom = 13
            if(infoPage.count != 0){
              lat = parseFloat(dataPage[0].latitude);
              //console.log(lat)
              long = parseFloat(dataPage[0].longitude);
              //console.log(long)
              zoom = 20;
            }
            let fecha = new Date(); //Fecha actual
            let mes = fecha.getMonth()+1; //obteniendo mes
            let dia = fecha.getDate(); //obteniendo dia
            let anio = fecha.getFullYear(); //obteniendo año
            let _hours = fecha.getHours();
            let _minutes = fecha.getMinutes();
            let _fixedHours = ('0' + _hours).slice(-2);
            let _fixedMinutes = ('0' + _minutes).slice(-2);
            if(dia<10)
                dia='0'+dia; //agrega cero si el menor de 10
            if(mes<10)
                mes='0'+mes //agrega cero si el menor de 10
            this.entityDialogContainer.innerHTML = '';
            this.entityDialogContainer.style.display = 'flex';
            this.entityDialogContainer.innerHTML = `
            
        <div class="entity_editor" id="entity-editor" style="max-width:80%">
          <div class="entity_editor_header">
            <div class="user_info">
              <div class="avatar"><i class="fa-solid fa-map-location"></i></div>
              <h1 class="entity_editor_title">Registrar <br><small>Ubicación</small></h1>
            </div>
            <button class="btn btn_close_editor" id="close"><i class="fa-regular fa-x"></i></button>
          </div>
          <!-- EDITOR BODY -->
          <div class="entity_editor_body">
          
          <div class="fila" style="display: flex">
            <div class="elemento" style ="flex: 1;">
              <div  style="padding-bottom:20px"> 
              <input id="pac-input" class="controls pac-target-input" type="text" placeholder="Ciudad, lugar o calle" autocomplete="off">
                <button id="obtCords">Buscar</button>
              </div>
              <div id="map" style="height: 400px;width: 600px">
              </div>
            </div>
            <div class="elemento" style ="flex: 0.6">
            <div class="material_input">
              <input type="text" id="entity-name" autocomplete="none">
              <label for="entity-name">Nombre Ubicación</label>
            </div>
            <div class="material_input">
              <input type="text" id="entity-cords" autocomplete="none" value="${lat}, ${long}">
              <label for="entity-cords">Coordenadas [Lat, long]</label>
            </div>
            <div class="form_group">
                <div class="form_input">
                    <label class="form_label" for="entity-scheduleTime">Inicio:</label>
                    <input type="time" class="input_time input_time-start" id="entity-scheduleTime" name="entity-scheduleTime" value="${_fixedHours}:${_fixedMinutes}">
                </div>

                <div class="form_input">
                    <label class="form_label" for="entity-scheduleTimeEnd">Fin:</label>
                    <input type="time" class="input_time input_time-end" id="entity-scheduleTimeEnd" name="entity-scheduleTimeEnd" value="${_fixedHours}:${_fixedMinutes}">
                </div>
            </div>
            <br>
            <div class="form_group">
                <div class="form_input">
                  <label class="form_label" for="entity-distance">Distancia (metros)</label>
                  <select class="input_time input_time-start" id="entity-distance">
                      <option value="5" selected>5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="30">30</option>
                      <option value="40">40</option>
                      <option value="50">50</option>
                      <option value="60">60</option>
                  </select>
                </div>

                <div class="form_input">
                  <label class="form_label" for="entity-frequency">Frecuencia (minutos)</label>
                  <select class="input_time input_time-end" id="entity-frequency">
                      <option value="10" selected>10</option>
                      <option value="15">15</option>
                      <option value="30">30</option>
                      <option value="60">60</option>
                  </select>
                </div>
            </div>    
          </div>
        </div>
            
            
            
          </div>
          <!-- END EDITOR BODY -->
          <div class="entity_editor_footer">
            <button class="btn btn_primary btn_widder" id="register-entity">Guardar</button>
          </div>
        </div-->
      `;
            // @ts-ignore
            inputObserver();
            initAutocomplete(lat, long, zoom);
            this.close();
            const registerButton = document.getElementById('register-entity');
            registerButton.addEventListener('click', async () => {
                const businessData = await currentBusiness();
                const inputsCollection = {
                    name: document.getElementById('entity-name'),
                    cords: document.getElementById('entity-cords'),
                    scheduleTime: document.getElementById('entity-scheduleTime'),
                    scheduleTimeEnd: document.getElementById('entity-scheduleTimeEnd'),
                    frequency: document.getElementById('entity-frequency'),
                    distance: document.getElementById('entity-distance'),

                };
                const coords = inputsCollection.cords.value.split(',');
                //console.log(coords)
                const latitud = parseFloat(coords[0].trim());
                //console.log(latitud)
                const longitud = parseFloat(coords[1].trim());
                //console.log(longitud)
                const timeIni = inputsCollection.scheduleTime.value.split(':');
                const hourIni = parseInt(timeIni[0].trim());
                //console.log(hourIni)
                const minIni = parseInt(timeIni[1].trim());
                //console.log(minIni)
                const timeEnd = inputsCollection.scheduleTimeEnd.value.split(':');
                const hourEnd = parseInt(timeEnd[0].trim());
                //console.log(hourEnd)
                const minEnd = parseInt(timeEnd[1].trim());
                //console.log(minEnd)
                const raw = JSON.stringify({
                    "name": `${inputsCollection.name.value}`,
                    "cords": `${inputsCollection.cords.value}`,
                    'latitude' : `${latitud}`,
                    'longitude' : `${longitud}`,
                    "frequency": `${inputsCollection.frequency.value}`,  
                    "distance": `${inputsCollection.distance.value}`,  
                    "business": {
                        "id": `${businessData.business.id}`
                    },                 
                    "customer": {
                        "id": `${customerId}`
                    },
                    "routine": {
                      "id": `${routine.id}`
                    },
                    'scheduleTime': `${inputsCollection.scheduleTime.value}`,
                    'scheduleTimeEnd': `${inputsCollection.scheduleTimeEnd.value}`,
                    'creationDate': `${currentDateTime().date}`,
                    'creationTime': `${currentDateTime().timeHHMMSS}`,
                });
                if(inputsCollection.name.value == "" || inputsCollection.name.value == undefined){
                  alert("Nombre de Ubicación vacía");
                }else if(inputsCollection.cords.value == "" || inputsCollection.cords.value == undefined){
                  alert("No se ha seleccionado una ubicación");
                }else if(inputsCollection.distance.value == "" || inputsCollection.distance.value == undefined || inputsCollection.distance.value < 0){
                  alert("Distancia inválida");
                }else if(routine.id == '' || routine.id == null || routine.id == undefined){
                  alert("No hay rutina");
                }else if(hourIni == hourEnd && minIni > minEnd){
                  alert("Minutos iniciales no pueden ser mayores a las del final en horas iguales.");
                }else{
                  registerEntity(raw, 'RoutineSchedule');
                  setTimeout(() => {
                      const container = document.getElementById('entity-editor-container');
                      new CloseDialog().x(container);
                      new Locations().render(Config.offset, Config.currentPage, infoPage.search, routine.id);
                  }, 1000);
                }
            });
            const btnObtCords = document.getElementById('obtCords');
            btnObtCords.addEventListener('click', () => {
                var geocoder = new google.maps.Geocoder();
                var direccion = document.getElementById('pac-input').value; // Obtén la dirección ingresada por el usuario desde un campo de entrada de texto
            
                geocoder.geocode({ 'address': direccion }, function(results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                    var latitud = results[0].geometry.location.lat();
                    var longitud = results[0].geometry.location.lng();
                    //console.log('Latitud: ' + latitud);
                    //console.log('Longitud: ' + longitud);
                    initAutocomplete(latitud, longitud, 20);
                } else {
                    //console.log('Geocodificación fallida: ' + status);
                    alert("No encontrado "+status);
                }
                });
            });
             
            
        };
        async function initAutocomplete(lat, lng, zoom) {
          //var map = new google.maps.Map(document.getElementById('map'), {
          var marker1;
          const { Map } = await google.maps.importLibrary("maps");
          const { AdvancedMarkerElement } = await google.maps.importLibrary("marker")
    
          var map = new Map(document.getElementById("map"), {
            center: {
              lat: lat,
              lng: lng
            },
            zoom: zoom,
            mapId: Config.mapIdGM,
            mapTypeId: 'hybrid'
          });
    
           // Create the search box and link it to the UI element.
          var input = document.getElementById('pac-input');
          //console.log(input);
          var searchBox = new google.maps.places.SearchBox(input);       
          //map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    
            // Bias the SearchBox results towards current map's viewport.
            map.addListener('bounds_changed', function() {
                searchBox.setBounds(map.getBounds());
            });
            map.addListener('click', function(event) {
                let location = event.latLng;
                //console.log(location)
                if (marker1) {
                    //marker1.setPosition(location);
                    marker1.map = null;
                    marker1 = new AdvancedMarkerElement({
                        position: location,
                        map: map,
                        title: 'Mi marcador'
                    });
                  } else {
                    //marker1 = new google.maps.Marker({
                    marker1 = new AdvancedMarkerElement({
                        position: location,
                        map: map,
                        title: 'Mi marcador'
                    });
                  }
                  const cords = document.getElementById('entity-cords');
                  cords.classList.add('input_filled');
                  cords.setAttribute('value', `${location.lat()}, ${location.lng()}`);
                  //var latitud = location.lat();
                  //var longitud = location.lng();
                  //console.log('Latitud2: ' + latitud);
                  //console.log('Longitud2: ' + longitud)
        
            });
          } 
        

    }
    edit(container, data) {

      const edit = document.querySelectorAll('#edit-entity');
      edit.forEach((edit) => {
          const entityId = edit.dataset.entityid;
          edit.addEventListener('click', () => {
              RInterface('RoutineSchedule', entityId);
          });
      });
      const RInterface = async (entities, entityID) => {
          const data = await getEntityData(entities, entityID);
          this.entityDialogContainer.innerHTML = '';
          this.entityDialogContainer.style.display = 'flex';
          this.entityDialogContainer.innerHTML = `
      <div class="entity_editor" id="entity-editor" style="max-width:80%">
        <div class="entity_editor_header">
          <div class="user_info">
            <div class="avatar"><i class="fa-regular fa-map-location"></i></div>
            <h1 class="entity_editor_title">Editar <br><small>${data.name}</small></h1>
          </div>
          <button class="btn btn_close_editor" id="close"><i class="fa-solid fa-x"></i></button>
        </div>
        <!-- EDITOR BODY -->
        <div class="entity_editor_body">
          <div class="fila" style="display: flex">
            <div class="elemento" style ="flex: 1;">
              <div  style="padding-bottom:20px"> 
                <input id="pac-input" class="controls pac-target-input" type="text" placeholder="Ciudad, lugar o calle" autocomplete="off">
                  <button id="obtCords">Buscar</button>
              </div>
              <div id="map" style="height: 400px;width: 600px"></div>
            </div>
            <div class="elemento" style ="flex: 0.6">
              <div class="material_input">
                <input type="text"
                  id="entity-name"
                  class="input_filled"
                  value="${data?.name ?? ''}">
                <label for="entity-name">Nombre Ubicación</label>
              </div>
              <div class="material_input">
                <input type="text"
                  id="entity-cords"
                  class="input_filled"
                  value="${data?.cords ?? ''}">
                <label for="entity-cords">Coordenadas [Lat, long]</label>
              </div>
              <div class="form_group">
                <div class="form_input">
                    <label class="form_label" for="entity-scheduleTime">Inicio:</label>
                    <input type="time" class="input_time input_time-start" id="entity-scheduleTime" name="entity-scheduleTime" value="${data?.scheduleTime ?? ''}">
                </div>

                <div class="form_input">
                    <label class="form_label" for="entity-scheduleTimeEnd">Fin:</label>
                    <input type="time" class="input_time input_time-end" id="entity-scheduleTimeEnd" name="entity-scheduleTimeEnd" value="${data?.scheduleTimeEnd ?? ''}">
                </div>
              </div>
              <br>
              <div class="form_group">
                  <div class="form_input">
                    <label class="form_label" for="entity-distance">Distancia (metros)</label>
                    <select class="input_time input_time-start" id="entity-distance">
                        <option value="5" selected>5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="30">30</option>
                        <option value="40">40</option>
                        <option value="50">50</option>
                        <option value="60">60</option>
                    </select>
                  </div>

                  <div class="form_input">
                    <label class="form_label" for="entity-frequency">Frecuencia (minutos)</label>
                    <select class="input_time input_time-end" id="entity-frequency">
                        <option value="10" selected>10</option>
                        <option value="15">15</option>
                        <option value="30">30</option>
                        <option value="60">60</option>
                    </select>
                  </div>
              </div>
              <div style="display:flex;justify-content:center">
                    <img alt="Código QR ${data?.name.trim() ?? ''}" id="qrcode">
                    <br>
                    <button id="btnDescargar">Descargar</button>
              </div>
            </div>
          </div>
        </div>
        <!-- END EDITOR BODY -->
        <div class="entity_editor_footer">
          <button class="btn btn_primary btn_widder" id="update-changes">Guardar</button>
        </div>
      </div>
    `;
          const coords = data?.cords.split(',');
          //console.log(coords)
          const latitud = parseFloat(coords[0].trim());
          //console.log(latitud)
          const longitud = parseFloat(coords[1].trim());
          //console.log(longitud)
          inputObserver();
          document.getElementById("entity-distance").value = data?.distance;
          document.getElementById("entity-frequency").value = data?.frequency;
          initAutocomplete(latitud, longitud, 20, data);
          this.close();
          const qr = document.getElementById("qrcode");
            // @ts-ignore
            new QRious({
                element: qr,
                value: data.id,
                size: 250,
                backgroundAlpha: 1,
                foreground: "#1D4C82FF",
                level: "H", // Puede ser L,M,Q y H (L es el de menor nivel, H el mayor)
            });
            download(qr, data);
          UUpdate(entityID, data);
      };
      const download = (qr, data) => {
        const btnDescargar = document.getElementById('btnDescargar');
        btnDescargar.addEventListener('click', () => {
            const enlace = document.createElement("a");
            enlace.href = qr.src;
            enlace.download = `Código QR ${data?.name.trim() ?? ''}.png`;
            enlace.click();
        });
    };
      const UUpdate = async (entityId, data) => {
          const updateButton = document.getElementById('update-changes');
          const $value = {
            // @ts-ignore
            name: document.getElementById('entity-name'),
            // @ts-ignore
            cords: document.getElementById('entity-cords'),
            scheduleTime: document.getElementById('entity-scheduleTime'),
            scheduleTimeEnd: document.getElementById('entity-scheduleTimeEnd'),
            // @ts-ignore
            distance: document.getElementById('entity-distance'),
            frequency: document.getElementById('entity-frequency'),

          };
          updateButton.addEventListener('click', () => {
            const coords = $value.cords.value.split(',');
            //console.log(coords)
            const latitud = parseFloat(coords[0].trim());
            //console.log(latitud)
            const longitud = parseFloat(coords[1].trim());
            //console.log(longitud)
            const timeIni = $value.scheduleTime.value.split(':');
            const hourIni = parseInt(timeIni[0].trim());
            //console.log(hourIni)
            const minIni = parseInt(timeIni[1].trim());
            //console.log(minIni)
            const timeEnd = $value.scheduleTimeEnd.value.split(':');
            const hourEnd = parseInt(timeEnd[0].trim());
            //console.log(hourEnd)
            const minEnd = parseInt(timeEnd[1].trim());
            //console.log(minEnd)
            let raw = JSON.stringify({
                // @ts-ignore
                "name": `${$value.name.value}`,
                // @ts-ignore
                "cords": `${$value.cords.value}`,
                "latitude": `${latitud}`,
                "longitude": `${longitud}`,
                "scheduleTime": `${$value.scheduleTime.value}`,
                "scheduleTimeEnd": `${$value.scheduleTimeEnd.value}`,
                // @ts-ignore
                "distance": `${$value.distance.value}`,
                "frequency": `${$value.frequency.value}`,
            });
            if($value.name.value == "" || $value.name.value == undefined){
              alert("Nombre de Ubicación vacía");
            }else if($value.cords.value == "" || $value.cords.value == undefined){
              alert("No se ha seleccionado una ubicación");
            }else if($value.distance.value == "" || $value.distance.value == undefined || $value.distance.value < 0){
              alert("Distancia inválida");
            }else if(hourIni == hourEnd && minIni > minEnd){
              alert("Minutos iniciales no pueden ser mayores a las del final en horas iguales.");
            }else{
              update(raw);
            }
          });
          const btnObtCords = document.getElementById('obtCords');
            btnObtCords.addEventListener('click', () => {
                var geocoder = new google.maps.Geocoder();
                var direccion = document.getElementById('pac-input').value; // Obtén la dirección ingresada por el usuario desde un campo de entrada de texto
            
                geocoder.geocode({ 'address': direccion }, function(results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                    var latitud = results[0].geometry.location.lat();
                    var longitud = results[0].geometry.location.lng();
                    //console.log('Latitud: ' + latitud);
                    //console.log('Longitud: ' + longitud);
                    initAutocomplete(latitud, longitud, 20, data);
                } else {
                    //console.log('Geocodificación fallida: ' + status);
                    alert("No encontrado "+status);
                }
                });
            });
          const update = (raw) => {
            updateEntity('RoutineSchedule', entityId, raw)
                .then((res) => {
                setTimeout(async () => {
                    if($value.frequency.value != data.frequency || $value.scheduleTime.value != data?.scheduleTime || $value.scheduleTimeEnd.value != data?.scheduleTimeEnd)
                      createRoutines('UPD', routine.id, entityId);
                    let tableBody;
                    let container;
                    //let data;
                    //data = await getLocations();
                    new CloseDialog()
                        .x(container =
                        document.getElementById('entity-editor-container'));
                    new Locations().render(infoPage.offset, infoPage.currentPage, infoPage.search, routine.id);
                    //new Locations().load(tableBody
                    //    = document.getElementById('datatable-body'), currentPage, data);
                }, 100);
            });
        };
      };
      async function initAutocomplete(lat, lng, zoom, data) {
        //var map = new google.maps.Map(document.getElementById('map'), {
        var marker1;
        var marker2;
        const { Map } = await google.maps.importLibrary("maps");
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker")
        var map = new Map(document.getElementById("map"), {
          center: {
            lat: lat,
            lng: lng
          },
          zoom: zoom,
          mapId: Config.mapIdGM,
          mapTypeId: 'hybrid'
        });
  
         // Create the search box and link it to the UI element.
        var input = document.getElementById('pac-input');
        //console.log(input);
        var searchBox = new google.maps.places.SearchBox(input);       
        //map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
  
          // Bias the SearchBox results towards current map's viewport.
          map.addListener('bounds_changed', function() {
              searchBox.setBounds(map.getBounds());
          });
          map.addListener('click', function(event) {
              let location = event.latLng;
              //console.log(location)
              if (marker1) {
                  //marker1.setPosition(location);
                  marker1.map = null;
                  marker1 = new AdvancedMarkerElement({
                      position: location,
                      map: map,
                      title: 'Mi marcador'
                  });
                } else {
                  //marker1 = new google.maps.Marker({
                  marker1 = new AdvancedMarkerElement({
                      position: location,
                      map: map,
                      title: 'Mi marcador'
                  });
                }
                const cords = document.getElementById('entity-cords');
                cords.classList.add('input_filled');
                cords.setAttribute('value', `${location.lat()}, ${location.lng()}`);
                if(marker2 != undefined)
                  marker2.map = null;
                  //marker2.setMap(null);
                //var latitud = location.lat();
                //var longitud = location.lng();
                //console.log('Latitud2: ' + latitud);
                //console.log('Longitud2: ' + longitud)
      
          });
          if(lat != "" || lng != ""){
            let myLatLng = { lat: lat, lng: lng };
            const latitude = parseFloat(data.latitude);
            const longitude = parseFloat(data.longitude);
            if(lat != latitude && lng != longitude){
              myLatLng = { lat: latitude, lng: longitude };
            }
            //marker2 =  new google.maps.Marker({
            marker2 = new AdvancedMarkerElement({
              position: myLatLng,
              map,
              title: "Posición Actual",
              });
              //marker2.setMap(map);
            }
        } 
  }
    remove() {
        const remove = document.querySelectorAll('#remove-entity');
        remove.forEach((remove) => {
            const entityId = remove.dataset.entityid;
            remove.addEventListener('click', () => {
                this.dialogContainer.style.display = 'flex';
                this.dialogContainer.innerHTML = `
          <div class="dialog_content" id="dialog-content">
            <div class="dialog dialog_danger">
              <div class="dialog_container">
                <div class="dialog_header">
                  <h2>¿Deseas eliminar esta Ubicación?</h2>
                </div>
                <div class="dialog_message">
                  <p>Esta acción no se puede revertir</p>
                </div>
                <div class="dialog_footer">
                  <button class="btn btn_primary" id="cancel">Cancelar</button>
                  <button class="btn btn_danger" id="delete">Eliminar</button>
                </div>
              </div>
            </div>
          </div>
        `;
                // delete button
                // cancel button
                // dialog content
                const deleteButton = document.getElementById('delete');
                const cancelButton = document.getElementById('cancel');
                const dialogContent = document.getElementById('dialog-content');
                deleteButton.onclick = () => {
                    deleteEntity('RoutineSchedule', entityId)
                        .then(res => new Locations().render(infoPage.offset, infoPage.currentPage, infoPage.search, routine.id));
                    new CloseDialog().x(dialogContent);
                };
                cancelButton.onclick = () => {
                    new CloseDialog().x(dialogContent);
                };
            });
        });
    }
    selectModal() {
      // register entity
      const view = document.querySelectorAll('#view-entity');
      view.forEach((element) => {
        const entityId = element.dataset.entityid;
        element.addEventListener('click', () => {
          modalTable(0, entityId);
        });
      });
      async function modalTable(offset, id) {
        const dialogContainer = document.getElementById('app-dialogs');
        //const guards = await getDetails('routine.id', routine.id, 'RoutineUser');
        let raw = JSON.stringify({
            "filter": {
                "conditions": [
                    {
                        "property": "routineSchedule.id",
                        "operator": "=",
                        "value": `${id}`
                    }
                ],
            },
            sort: "+routineTimePoint",
            limit: Config.modalRows,
            offset: offset
        });
        let dataModal = await getFilterEntityData("RoutineTime", raw);
        dialogContainer.style.display = 'block';
        dialogContainer.innerHTML = `
              <div class="dialog_content" id="dialog-content">
                  <div class="dialog">
                      <div class="dialog_container padding_8">
                          <div class="dialog_header">
                              <h2>Tiempos Calculados</h2>
                          </div>

                          <div class="dialog_message padding_8">
                              <div class="dashboard_datatable">
                                  <table class="datatable_content margin_t_16">
                                  <thead>
                                      <tr>
                                      <th>Tiempo</th>
                                      </tr>
                                  </thead>
                                  <tbody id="datatable-modal-body">
                                  </tbody>
                                  </table>
                              </div>
                              <br>
                          </div>

                          <div class="dialog_footer">
                              <button class="btn btn_primary" id="prevModal"><i class="fa-solid fa-arrow-left"></i></button>
                              <button class="btn btn_primary" id="nextModal"><i class="fa-solid fa-arrow-right"></i></button>
                              <button class="btn btn_danger" id="cancel">Cancelar</button>
                          </div>
                      </div>
                  </div>
              </div>
          `;
        inputObserver();
        const datetableBody = document.getElementById('datatable-modal-body');
        if (dataModal.length === 0) {
            let row = document.createElement('tr');
            row.innerHTML = `
                  <td>No hay datos</td>
                  <td></td>
                  <td></td>
              `;
            datetableBody.appendChild(row);
        }
        else {
            for (let i = 0; i < dataModal.length; i++) {
                let time = dataModal[i];
                let row = document.createElement('tr');
                row.innerHTML += `
                    <td>${time?.routineTimePoint ?? ''}</td>
                `;
                datetableBody.appendChild(row);
            }
        }
        const _closeButton = document.getElementById('cancel');
        const _dialog = document.getElementById('dialog-content');
        const prevModalButton = document.getElementById('prevModal');
        const nextModalButton = document.getElementById('nextModal');

        _closeButton.onclick = () => {
            new CloseDialog().x(_dialog);
        };
        nextModalButton.onclick = () => {
            offset = Config.modalRows + (offset);
            modalTable(offset, id);
        };
        prevModalButton.onclick = () => {
            if(offset > 0){
              offset = offset - Config.modalRows;
              modalTable(offset, id);
            }
        };
    }

  }
    close() {
        const closeButton = document.getElementById('close');
        const editor = document.getElementById('entity-editor-container');
        closeButton.addEventListener('click', () => {
            console.log('close');
            new CloseDialog().x(editor);
        });
    }
    

    /*placeMarker(location) {
        if (marker1) {
        marker1.setPosition(location);
        } else {
        marker1 = new google.maps.Marker({
            position: location,
            map: map,
            title: 'Mi marcador'
        });
        
        
        }
        
        var latitud = location.lat();
        var longitud = location.lng();
        const myLatLng = { lat: latitud, lng: longitud };
        /*marker2 =  new google.maps.Marker({
        position: myLatLng,
        map,
        title: "Hello World!",
        });
        marker2.setMap(map);
        console.log('Latitud2: ' + latitud);
        console.log('Longitud2: ' + longitud);
    }*/
        

}
/*export const setNewPassword = async () => {
    const users = await getEntitiesData('User');
    const FNewUsers = users.filter((data) => data.isSuper === false);
    FNewUsers.forEach((newUser) => {
    });
    console.group('Nuevos usuarios');
    console.log(FNewUsers);
    console.time(FNewUsers);
    console.groupEnd();
};*/

/*if(timeIni[0] > timeEnd[0]){
  console.log("caso 1");
  let schedules = calculoTimes(ubications, timeIni, timeEnd);
  console.log(schedules);
}else if(timeIni[0] < timeEnd[0]){
  console.log("caso 2");
  let schedules = calculoTimes(ubications, timeIni, timeEnd);
  console.log(schedules);
}else if(timeIni[0] == timeEnd[0]){
  console.log("caso 3");
  let schedules = calculoTimes(ubications, timeIni, timeEnd);
  console.log(schedules);
}*/
const agregarCero = (valor) => {
  valor < 10 ? valor = "0"+valor : valor;
  return valor;
}

const createRoutines = async (mode, routineId, scheduleId) => {
  const insertTimes = (ubications) => {
    const schedules = calculoTimes(ubications);
    console.log(schedules);
    schedules.forEach(async (schedule) => {
      const raw = JSON.stringify({ 
        "business": {
            "id": `${ubications.business.id}`
        },                 
        "customer": {
            "id": `${customerId}`
        },
        "routine": {
          "id": `${routineId}`
        },
        "routineSchedule": {
          "id": `${ubications.id}`
        },
        'routineTimePoint': `${schedule}`
      });
      registerEntity(raw, 'RoutineTime');
    });
    
  }

  const deleteTimes = (times) => {
    for(let i=0; i<times.length; i++){
      deleteEntity('RoutineTime', times[i].id);
    }
  }

  const calculoTimes = (ubications) => {
    let timesResults = [];
    const timeIni = ubications.scheduleTime.split(":");
    const timeEnd = ubications.scheduleTimeEnd.split(":");
    timesResults.push(ubications.scheduleTime);
    let minAdd = timeIni[1];
    let minRest = 0;
    let hourAdd = 0;
    let validators; 
    let releaseHour = false;
    let releaseMin = false;
    let i = 0;
    do {
      minAdd = parseInt(minAdd) + ubications.frequency;
      validators = timesResults[i].split(":");
      if((equivalentTime(timeEnd[0]) == equivalentTime(validators[0])) && releaseHour == false){
        releaseHour = true;
      }

      if(releaseHour == true && (minAdd > parseInt(timeEnd[1]))){
        releaseMin = true;
      }else{
        if(parseInt(minAdd) > 59){
          minRest = minAdd - 60; //minutos restantes
          hourAdd += 1;
          minAdd = minRest;
          if((parseInt(timeIni[0]) + hourAdd) > 24){
            timesResults.push(agregarCero((parseInt(timeIni[0]) + hourAdd)-24)+":"+agregarCero(minRest)+":00");
          }else if((parseInt(timeIni[0]) + hourAdd) == 24){
            timesResults.push(agregarCero(equivalentTime(parseInt(timeIni[0]) + hourAdd))+":"+agregarCero(minRest)+":00");
          }else{
            timesResults.push(agregarCero(parseInt(timeIni[0]) + hourAdd)+":"+agregarCero(minRest)+":00");
          }

          
        }else{
          if((parseInt(timeIni[0]) + hourAdd) > 24){
            timesResults.push(agregarCero((parseInt(timeIni[0]) + hourAdd)-24)+":"+agregarCero(minAdd)+":00");
          }else if((parseInt(timeIni[0]) + hourAdd) == 24){
            timesResults.push(agregarCero(equivalentTime(parseInt(timeIni[0]) + hourAdd))+":"+agregarCero(minAdd)+":00");
          }else{
            timesResults.push(agregarCero(parseInt(timeIni[0]) + hourAdd)+":"+agregarCero(minAdd)+":00");
          }
        }
        i+=1;
      }
      
    } while (releaseMin != true);
    return timesResults;
  }

  if(mode == 'INS'){
    let data = await getDetails("routine.id", routineId, "RoutineSchedule");
    data.forEach(async (ubications) => {
      let raw = JSON.stringify({
        "filter": {
            "conditions": [
                {
                  "property": "routineSchedule.id",
                  "operator": "=",
                  "value": `${ubications.id}`
                },
            ],
        },
        sort: "-createdDate",
      });
      let times = await getFilterEntityData("RoutineTime", raw);
      if(times != undefined && times.length == 0){
        insertTimes(ubications);
      }
    });
  }else if(mode == 'UPD'){
    const data = await getEntityData("RoutineSchedule", scheduleId);
    let raw = JSON.stringify({
      "filter": {
          "conditions": [
              {
                "property": "routineSchedule.id",
                "operator": "=",
                "value": `${scheduleId}`
              },
          ],
      },
      sort: "-createdDate",
    });
    let times = await getFilterEntityData("RoutineTime", raw);
    if(times != undefined && times.length != 0){
      deleteTimes(times);
      insertTimes(data);
    }
  }
};