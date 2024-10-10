// @filename: Routines.ts
import { registerEntity, getUserInfo, getEntityData, updateEntity, getFilterEntityData, getFilterEntityCount, deleteEntity } from "../../../endpoints.js";
import { drawTagsIntoTables, inputObserver, inputSelect, CloseDialog, filterDataByHeaderType, pageNumbers, fillBtnPagination, currentDateTime, getDetails, getPermission } from "../../../tools.js";
import { Config } from "../../../Configs.js";
import { tableLayout } from "./Layout.js";
import { tableLayoutTemplate } from "./Template.js";
import { Locations } from "../routines/locations/Locations.js";
import { RoutineUsers } from "../routines/users/Users.js";
const tableRows = Config.tableRows;
const currentPage = Config.currentPage;
const customerId = localStorage.getItem('customer_id');
let infoPage = {
  count: 0,
  offset: Config.offset,
  currentPage: currentPage,
  search: "",
  msgPermission: "",
  actions: []
};
const currentBusiness = async() => {
  //const currentUser = await getUserInfo();
  //const userid = await getEntityData('User', `${currentUser.attributes.id}`);
  return Config.currentUser;
}

const getRoutines = async () => {
  const response = async () => {
    let raw = JSON.stringify({
        "filter": {
            "conditions": [
                {
                  "property": "customer.id",
                  "operator": "=",
                  "value": `${customerId}`
                }
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
                  }
              ]
          },
          sort: "-createdDate",
          limit: Config.tableRows,
          offset: infoPage.offset,
          fetchPlan: 'full',
      });
    }
    infoPage.count = await getFilterEntityCount("Routine", raw);
    return await getFilterEntityData("Routine", raw);
  }
  if(Config.currentUser?.isMaster){
    return response();
  }else{
    const permission = await getPermission('ROUTINE_CONFIG', Config.currentUser.id);
    if(permission.code === 3){
        infoPage.actions = permission.message.actionsText.split(';');
        if(infoPage.actions.includes("READ")){
            return response();
        }else{
            infoPage.msgPermission = "Usuario no tiene permiso de lectura.";
            infoPage.count = 0;
            return [];
        }
    }else{
        infoPage.msgPermission = permission.message;
        infoPage.count = 0;
        return [];
    }
    
  }
};
export class Routines {
    constructor() {
        this.dialogContainer = document.getElementById('app-dialogs');
        this.entityDialogContainer = document.getElementById('entity-editor-container');
        this.content = document.getElementById('datatable-container');
        this.searchEntity = async (tableBody /*, data*/) => {
            const search = document.getElementById('search');
            const btnSearch = document.getElementById('btnSearch');
            search.value = infoPage.search;
            await search.addEventListener('keyup', () => {
                /*const arrayData = data.filter((data) => `${data.name}
                 ${data.ruc}`
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
              new Routines().render(Config.offset, Config.currentPage, search.value.toLowerCase().trim());
          });
        };
    }
    async render(offset, actualPage, search) {
        infoPage.offset = offset;
        infoPage.currentPage = actualPage;
        infoPage.search = search;
        this.content.innerHTML = '';
        this.content.innerHTML = tableLayout;
        const tableBody = document.getElementById('datatable-body');
        tableBody.innerHTML = '.Cargando...';
        let data = await getRoutines();
        tableBody.innerHTML = tableLayoutTemplate.repeat(tableRows);
        this.load(tableBody, currentPage, data);
        this.searchEntity(tableBody /*, data*/);
        new filterDataByHeaderType().filter();
        this.pagination(data, tableRows, infoPage.currentPage);
    }
    load(table, currentPage, data) {
        table.innerHTML = '';
        currentPage--;
        let start = tableRows * currentPage;
        let end = start + tableRows;
        let paginatedItems = data.slice(start, end);
        if (data.length === 0) {
            let mensaje = `No existen datos. ${infoPage.msgPermission}`;
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
                let routine = paginatedItems[i];
                let row = document.createElement('tr');
                row.innerHTML += `
          <td>${routine?.name ?? ''}</dt>
          <td>${routine?.isActive ? 'Sí' : 'No'}</dt>
          <td>${routine?.checkLocation ? 'Sí' : 'No'}</dt>
          <td class="entity_options">
              <button class="button" id="edit-entity" data-entityId="${routine.id}">
                <i class="fa-solid fa-pen"></i>
              </button>

              <button class="button" id="location-entity" data-entityId="${routine.id}">
                <i class="fa-solid fa-map-location"></i>
              </button>

              <button class="button" id="guard-entity" data-entityId="${routine.id}">
                <i class="fa-solid fa-user-police"></i>
              </button>

            <button class="button" id="remove-entity" data-entityId="${routine.id}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </dt>
        `;
                table.appendChild(row);
                drawTagsIntoTables();
            }
        }
        this.register();
        this.remove();
        this.location();
        this.assignGuard();
        this.edit(this.entityDialogContainer, data);
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
              infoPage.offset = Config.tableRows * (page - 1);
              currentPage = page;
              new Routines().render(infoPage.offset, currentPage, infoPage.search);
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
            new Routines().render(Config.offset, Config.currentPage, infoPage.search);
          });
          nextButton.addEventListener('click', () => {
            infoPage.offset = Config.tableRows * (pageCount - 1);
            new Routines().render(infoPage.offset, pageCount, infoPage.search);
          });
      }
    }
    register() {
        // register entity
        const openEditor = document.getElementById('new-entity');
        openEditor.addEventListener('click', () => {
            if(infoPage.actions.includes("INS") || Config.currentUser?.isMaster){
              renderInterface();
            }else{
                alert("Usuario no tiene permiso de registrar.");
            }
        });
        const renderInterface = async () => {
            this.entityDialogContainer.innerHTML = '';
            this.entityDialogContainer.style.display = 'flex';
            this.entityDialogContainer.innerHTML = `
        <div class="entity_editor" id="entity-editor">
          <div class="entity_editor_header">
            <div class="user_info">
              <div class="avatar"><i class="fa-solid fa-gear"></i></div>
              <h1 class="entity_editor_title">Registrar <br><small>Rutina</small></h1>
            </div>

            <button class="btn btn_close_editor" id="close"><i class="fa-regular fa-x"></i></button>
          </div>

          <!-- EDITOR BODY -->
          <div class="entity_editor_body">
            <div class="material_input">
              <input type="text" id="entity-name" autocomplete="none">
              <label for="entity-name">Nombre</label>
            </div>

            <div class="input_checkbox">
                <label><input type="checkbox" class="checkbox" id="entity-active" checked> Activo</label>
            </div>

            <div class="input_checkbox">
                <label><input type="checkbox" class="checkbox" id="entity-checkLocation"> Validar Ubicación</label>
            </div>

          </div>
          <!-- END EDITOR BODY -->

          <div class="entity_editor_footer">
            <button class="btn btn_primary btn_widder" id="register-entity">Guardar</button>
          </div>
        </div>
      `;
            // @ts-ignore
            inputObserver();
            this.close();
            const registerButton = document.getElementById('register-entity');
            registerButton.addEventListener('click', async() => {
              if(!infoPage.actions.includes("INS") && !Config.currentUser?.isMaster){
                alert("Usuario no tiene permiso de registrar.");
              }else{
                const businessData = await currentBusiness();
                const inputsCollection = {
                    name: document.getElementById('entity-name'),
                    active: document.getElementById('entity-active'),
                    checkLocation: document.getElementById('entity-checkLocation')
                };
                const raw = JSON.stringify({
                    "name": `${inputsCollection.name.value}`,
                    "business": {
                        "id": `${businessData.business.id}`},
                    "customer": {
                      "id": `${customerId}`},
                    "isActive": `${inputsCollection.active.checked ? true : false}`,
                    "checkLocation": `${inputsCollection.checkLocation.checked ? true : false}`,
                    'creationDate': `${currentDateTime().date}`,
                    'creationTime': `${currentDateTime().timeHHMMSS}`,
                });
                if(inputsCollection.name.value == '' || inputsCollection.name.value == null || inputsCollection.name.value == undefined){
                  alert("Debe completar el nombre");
                }else{
                  registerEntity(raw, 'Routine').then((res) => {
                    setTimeout(() => {
                        const container = document.getElementById('entity-editor-container');
                        new CloseDialog().x(container);
                        new Routines().render(Config.offset, Config.currentPage, infoPage.search);
                    }, 1000);
                  });
                }
              }
            });
        };
        const reg = async (raw) => {
        };
    }
    edit(container, data) {
        // Edit entity
        const edit = document.querySelectorAll('#edit-entity');
        edit.forEach((edit) => {
            const entityId = edit.dataset.entityid;
            edit.addEventListener('click', () => {
                RInterface('Routine', entityId);
            });
        });
        const RInterface = async (entities, entityID) => {
            const data = await getEntityData(entities, entityID);
            this.entityDialogContainer.innerHTML = '';
            this.entityDialogContainer.style.display = 'flex';
            this.entityDialogContainer.innerHTML = `
        <div class="entity_editor" id="entity-editor">
          <div class="entity_editor_header">
            <div class="user_info">
              <div class="avatar"><i class="fa-regular fa-gear"></i></div>
              <h1 class="entity_editor_title">Editar <br><small>${data.name}</small></h1>
            </div>

            <button class="btn btn_close_editor" id="close"><i class="fa-solid fa-x"></i></button>
          </div>

          <!-- EDITOR BODY -->
          <div class="entity_editor_body">

            <div class="material_input">
              <input type="text"
                id="entity-name"
                class="input_filled"
                value="${data?.name ?? ''}">
              <label for="entity-name">Nombre</label>
            </div>

            <div class="input_checkbox">
                <label><input type="checkbox" class="checkbox" id="entity-active"> Activo</label>
            </div>

            <div class="input_checkbox">
                <label><input type="checkbox" class="checkbox" id="entity-checkLocation"> Validar Ubicación</label>
            </div>

            <br>
            <br>

            <div class="input_detail">
                <label for="creation-date"><i class="fa-solid fa-calendar"></i></label>
                <input type="date" id="creation-date" class="input_filled" value="${data.creationDate}" readonly>
            </div>
            <br>
            <div class="input_detail">
                <label for="creation-time"><i class="fa-solid fa-clock"></i></label>
                <input type="time" id="creation-time" class="input_filled" value="${data.creationTime}" readonly>
            </div>
            <br>
            <div class="input_detail">
                <label for="log-user"><i class="fa-solid fa-user"></i></label>
                <input type="text" id="log-user" class="input_filled" value="${data.createdBy}" readonly>
            </div>

          </div>
          <!-- END EDITOR BODY -->

          <div class="entity_editor_footer">
            <button class="btn btn_primary btn_widder" id="update-changes">Guardar</button>
          </div>
        </div>
      `;
            const checkboxActive = document.getElementById('entity-active');
            if (data.isActive === true) {
              checkboxActive?.setAttribute('checked', 'true');
            }

            const checkbox2Active = document.getElementById('entity-checkLocation');
            if (data.checkLocation === true) {
              checkbox2Active?.setAttribute('checked', 'true');
            }

            inputObserver();
            this.close();
            UUpdate(entityID);
        };
        const UUpdate = async (entityId) => {
            const updateButton = document.getElementById('update-changes');
            const $value = {
              // @ts-ignore
              name: document.getElementById('entity-name'),
              // @ts-ignore
              active: document.getElementById('entity-active'),
              checkLocation: document.getElementById('entity-checkLocation')
          };
            updateButton.addEventListener('click', () => {
              let raw = JSON.stringify({
                  // @ts-ignore
                  "name": `${$value.name.value}`,
                  "isActive": `${$value.active.checked ? true : false}`,
                  "checkLocation": `${$value.checkLocation.checked ? true : false}`
              });
              if(!infoPage.actions.includes("UPD") && !Config.currentUser?.isMaster){
                alert("Usuario no tiene permiso de actualizar.");
              }else if($value.name.value == '' || $value.name.value == null || $value.name.value == undefined){
                alert("Debe completar el nombre");
              }else{
                update(raw);
              }
            });
            const update = (raw) => {
              updateEntity('Routine', entityId, raw)
                  .then((res) => {
                  setTimeout(async () => {
                      let tableBody;
                      let container;
                      let data;
                      //data = await getRoutines();
                      new CloseDialog()
                          .x(container =
                          document.getElementById('entity-editor-container'));
                      new Routines().render(infoPage.offset, infoPage.currentPage, infoPage.search);
                  }, 100);
              });
          };
        };
    }
    remove() {
      const remove = document.querySelectorAll('#remove-entity');
      remove.forEach((remove) => {
          const entityId = remove.dataset.entityid;
          // BOOKMARK: MODAL
          remove.addEventListener('click', () => {
            if(!infoPage.actions.includes("DLT") && !Config.currentUser?.isMaster){
              alert("Usuario no tiene permiso de eliminar.");
            }else{
              this.dialogContainer.style.display = 'block';
              this.dialogContainer.innerHTML = `
                  <div class="dialog_content" id="dialog-content">
                      <div class="dialog dialog_danger">
                      <div class="dialog_container">
                          <div class="dialog_header">
                          <h2>¿Deseas eliminar esta rutina?</h2>
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
                  </div>`;
              const deleteButton = document.getElementById('delete');
              const cancelButton = document.getElementById('cancel');
              const dialogContent = document.getElementById('dialog-content');
              deleteButton.onclick = async() => {
                if(!infoPage.actions.includes("DLT") && !Config.currentUser?.isMaster){
                  alert("Usuario no tiene permiso de eliminar.");
                }else{
                  const locations = await getDetails('routine.id', entityId, 'RoutineSchedule');
                  if(locations.length != 0 && locations != undefined){
                    for(let i=0; i<locations.length; i++){
                      let raw = JSON.stringify({
                        "filter": {
                            "conditions": [
                                {
                                  "property": "routineSchedule.id",
                                  "operator": "=",
                                  "value": `${locations[i].id}`
                                },
                            ],
                        },
                        sort: "-createdDate",
                      });
                      let times = await getFilterEntityData("RoutineTime", raw);
                      for(let i=0; i<times.length; i++){
                        deleteEntity('RoutineTime', times[i].id);
                      }
                      deleteEntity('RoutineSchedule', locations[i].id);
                    }
                  }

                  const guards = await getDetails('routine.id', entityId, 'RoutineUser');
                  if(guards.length != 0 && guards != undefined){
                    for(let i=0; i<guards.length; i++){
                      deleteEntity('RoutineUser', guards[i].id);
                    }
                  }
                  deleteEntity('Routine', entityId)
                  .then((res) => {
                      setTimeout(async () => {
                          //let data = await getUsers();
                          const tableBody = document.getElementById('datatable-body');
                          new CloseDialog().x(dialogContent);
                          new Routines().render(infoPage.offset, infoPage.currentPage, infoPage.search);
                      }, 1000);
                  });
                }
              };
              cancelButton.onclick = () => {
                  new CloseDialog().x(dialogContent);
              };
            }
          });
      });
  }
    location() {
      const locationRoutine = document.querySelectorAll('#location-entity');
      locationRoutine.forEach((buttonKey) => {
            buttonKey.addEventListener('click', async () => {
                let entityId = buttonKey.dataset.entityid;
                new Locations().render(Config.offset, Config.currentPage, "", entityId, infoPage.actions);
            });
        });
  }
  assignGuard() {
    const userRoutine = document.querySelectorAll('#guard-entity');
    userRoutine.forEach((buttonKey) => {
          buttonKey.addEventListener('click', async () => {
              let entityId = buttonKey.dataset.entityid;
              new RoutineUsers().render(Config.offset, Config.currentPage, "", entityId, infoPage.actions);
          });
      });
}
    close() {
        const closeButton = document.getElementById('close');
        const editor = document.getElementById('entity-editor-container');
        closeButton.addEventListener('click', () => {
            //console.log('close');
            new CloseDialog().x(editor);
        });
    }
}

