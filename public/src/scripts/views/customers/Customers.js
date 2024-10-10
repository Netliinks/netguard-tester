// @filename: Customers.ts
import { registerEntity, getUserInfo, getEntityData, updateEntity, getFilterEntityData, getFilterEntityCount } from "../../endpoints.js";
import { drawTagsIntoTables, inputObserver, inputSelect, CloseDialog, filterDataByHeaderType, pageNumbers, fillBtnPagination, getPermission } from "../../tools.js";
import { Config } from "../../Configs.js";
import { tableLayout, UIContact } from "./Layout.js";
import { tableLayoutTemplate } from "./Template.js";
const tableRows = Config.tableRows;
const currentPage = Config.currentPage;
let infoPage = {
  count: 0,
  offset: Config.offset,
  currentPage: currentPage,
  search: "",
  msgPermission: "",
  actions: []
};
const currentBusiness = async() => {
  const currentUser = await getUserInfo();
  const userid = await getEntityData('User', `${currentUser.attributes.id}`);
  return userid;
}

const getCustomers = async () => {
    const currentUser = await currentBusiness();
    const response = async () => {
      let raw = JSON.stringify({
        "filter": {
            "conditions": [
                {
                    "property": "business.id",
                    "operator": "=",
                    "value": `${currentUser.business.id}`
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
                            },
                            {
                                "property": "ruc",
                                "operator": "contains",
                                "value": `${infoPage.search.toLowerCase()}`
                            }
                        ]
                    },
                    {
                      "property": "business.id",
                      "operator": "=",
                      "value": `${currentUser.business.id}`
                    }
                ]
            },
            sort: "-createdDate",
            limit: Config.tableRows,
            offset: infoPage.offset,
            fetchPlan: 'full',
        });
    }
    infoPage.count = await getFilterEntityCount("Customer", raw);
    return await getFilterEntityData("Customer", raw);
  }
  if(currentUser?.isMaster){
    return response();
  }else{
      const permission = await getPermission('CUSTOMER', currentUser.id);
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
export class Customers {
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
              new Customers().render(Config.offset, Config.currentPage, search.value.toLowerCase().trim());
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
        let data = await getCustomers();
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
            let row = document.createElement('tr');
            row.innerHTML = `
        <td>No existen datos. ${infoPage.msgPermission}</td>
        <td></td>
        <td></td>
      `;
            table.appendChild(row);
        }
        else {
            for (let i = 0; i < paginatedItems.length; i++) {
                let customer = paginatedItems[i];
                let row = document.createElement('tr');
                row.innerHTML += `
          <td>${customer?.name ?? ''}</dt>
          <td>${customer?.ruc ?? ''}</dt>
          <td class="tag"><span>${customer?.state?.name ?? ''}</span></td>
          <td>${customer?.permitMarcation ? 'Si' : 'No'}</td>
          <td>${customer?.permitVehicular ? 'Si' : 'No'}</td>
          <td>${customer?.permitRoutine ? 'Si' : 'No'}</td>
          <td class="entity_options">
              <button class="button" id="edit-entity" data-entityId="${customer.id}">
                <i class="fa-solid fa-pen"></i>
              </button>

              <button class="button" id="convert-entity" data-entityId="${customer.id}">
                <i class="fa-solid fa-shield"></i>
            </button>
          </dt>
        `;
                table.appendChild(row);
                drawTagsIntoTables();
            }
        }
        this.register();
        this.updateContact();
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
              new Customers().render(infoPage.offset, currentPage, infoPage.search);
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
            new Customers().render(Config.offset, Config.currentPage, infoPage.search);
          });
          nextButton.addEventListener('click', () => {
            infoPage.offset = Config.tableRows * (pageCount - 1);
            new Customers().render(infoPage.offset, pageCount, infoPage.search);
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
              <div class="avatar"><i class="fa-solid fa-briefcase"></i></div>
              <h1 class="entity_editor_title">Registrar <br><small>Empresa</small></h1>
            </div>

            <button class="btn btn_close_editor" id="close"><i class="fa-regular fa-x"></i></button>
          </div>

          <!-- EDITOR BODY -->
          <div class="entity_editor_body">
            <div class="material_input">
              <input type="text" id="entity-name" autocomplete="none">
              <label for="entity-name">Nombre</label>
            </div>

            <div class="material_input">
              <input type="text"
                id="entity-ruc"
                maxlength="13" autocomplete="none">
              <label for="entity-ruc">RUC</label>
            </div>

            <div class="material_input_select">
              <label for="entity-state">Estado</label>
              <input type="text" id="entity-state" class="input_select" readonly placeholder="cargando..." autocomplete="none">
              <div id="input-options" class="input_options">
              </div>
            </div>

            <div class="input_checkbox">
                <label><input type="checkbox" class="checkbox" id="entity-marcation" checked> Permitir Marcación</label>
            </div>

            <div class="input_checkbox">
                <label><input type="checkbox" class="checkbox" id="entity-vehicular"> Permitir Vehicular</label>
            </div>

            <div class="input_checkbox">
                <label><input type="checkbox" class="checkbox" id="entity-routine"> Permitir Rutina</label>
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
            inputSelect('State', 'entity-state');
            this.close();
            const registerButton = document.getElementById('register-entity');
            registerButton.addEventListener('click', async() => {
                const businessData = await currentBusiness();
                const inputsCollection = {
                    name: document.getElementById('entity-name'),
                    ruc: document.getElementById('entity-ruc'),
                    state: document.getElementById('entity-state'),
                    marcation: document.getElementById('entity-marcation'),
                    vehicular: document.getElementById('entity-vehicular'),
                    routine: document.getElementById('entity-routine')
                };
                const raw = JSON.stringify({
                    "name": `${inputsCollection.name.value}`,
                    "business": {
                        "id": `${businessData.business.id}`},
                    "ruc": `${inputsCollection.ruc.value}`,
                    "state": {
                      "id": `${inputsCollection.state.dataset.optionid}`},
                    "firebaseId":`${inputsCollection.name.value}`,
                    "associate":`${businessData.business.name}`,
                    "permitMarcation": `${inputsCollection.marcation.checked ? true : false}`,
                    "permitVehicular": `${inputsCollection.vehicular.checked ? true : false}`,
                    "permitRoutine": `${inputsCollection.routine.checked ? true : false}`,
                });
                if(!infoPage.actions.includes("INS") && !Config.currentUser?.isMaster){
                  alert("Usuario no tiene permiso de registrar.");
                }else if(inputsCollection.name.value == '' || inputsCollection.name.value == null || inputsCollection.name.value == undefined){
                  alert("Debe completar el nombre");
                }else{
                  registerEntity(raw, 'Customer');
                  setTimeout(() => {
                      const container = document.getElementById('entity-editor-container');
                      new CloseDialog().x(container);
                      new Customers().render(Config.offset, Config.currentPage, infoPage.search);
                  }, 1000);
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
                RInterface('Customer', entityId);
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
              <div class="avatar"><i class="fa-regular fa-briefcase"></i></div>
              <h1 class="entity_editor_title">Editar <br><small>${data.name}</small></h1>
            </div>

            <button class="btn btn_close_editor" id="close"><i class="fa-solid fa-x"></i></button>
          </div>

          <!-- EDITOR BODY -->
          <div class="entity_editor_body">
            <div class="material_input">
              <input type="text"
                id="entity-ruc"
                class="input_filled"
                maxlength="10"
                value="${data?.ruc ?? ''}">
              <label for="entity-ruc">RUC</label>
            </div>

            <div class="material_input_select">
              <label for="entity-state">Estado</label>
              <input type="text" id="entity-state" class="input_select" readonly placeholder="cargando...">
              <div id="input-options" class="input_options">
              </div>
            </div>

            <div class="input_checkbox">
                <label><input type="checkbox" class="checkbox" id="entity-marcation"> Permitir Marcación</label>
            </div>

            <div class="input_checkbox">
                <label><input type="checkbox" class="checkbox" id="entity-vehicular"> Permitir Vehicular</label>
            </div>

            <div class="input_checkbox">
                <label><input type="checkbox" class="checkbox" id="entity-routine"> Permitir Rutina</label>
            </div>

          </div>
          <!-- END EDITOR BODY -->

          <div class="entity_editor_footer">
            <button class="btn btn_primary btn_widder" id="update-changes">Guardar</button>
          </div>
        </div>
      `;
            const checkboxMarcation = document.getElementById('entity-marcation');
            if (data.permitMarcation === true) {
              checkboxMarcation?.setAttribute('checked', 'true');
            }

            const checkboxVehicular = document.getElementById('entity-vehicular');
            if (data.permitVehicular === true) {
              checkboxVehicular?.setAttribute('checked', 'true');
            }

            const checkboxRoutine = document.getElementById('entity-routine');
            if (data.permitRoutine === true) {
              checkboxRoutine?.setAttribute('checked', 'true');
            }
            inputObserver();
            inputSelect('State', 'entity-state', data.state.name);
            this.close();
            UUpdate(entityID);
        };
        const UUpdate = async (entityId) => {
            const updateButton = document.getElementById('update-changes');
            const $value = {
              // @ts-ignore
              ruc: document.getElementById('entity-ruc'),
              // @ts-ignore
              status: document.getElementById('entity-state'),
              // @ts-ignore
              marcation: document.getElementById('entity-marcation'),
              // @ts-ignore
              vehicular: document.getElementById('entity-vehicular'),
              // @ts-ignore
              routine: document.getElementById('entity-routine')
          };
            updateButton.addEventListener('click', () => {
              let raw = JSON.stringify({
                  // @ts-ignore
                  "ruc": `${$value.ruc.value}`,
                  "state": {
                      "id": `${$value.status?.dataset.optionid}`
                  },
                  "permitMarcation": `${$value.marcation.checked ? true : false}`,
                  "permitVehicular": `${$value.vehicular.checked ? true : false}`,
                  "permitRoutine": `${$value.routine.checked ? true : false}`,
              });
              if(!infoPage.actions.includes("UPD") && !Config.currentUser?.isMaster){
                alert("Usuario no tiene permiso de actualizar.");
              }else{
                update(raw);
              }
            });
            const update = (raw) => {
              updateEntity('Customer', entityId, raw)
                  .then((res) => {
                  setTimeout(async () => {
                      let tableBody;
                      let container;
                      let data;
                      //data = await getCustomers();
                      new CloseDialog()
                          .x(container =
                          document.getElementById('entity-editor-container'));
                      new Customers().render(infoPage.offset, infoPage.currentPage, infoPage.search);
                  }, 100);
              });
          };
        };
    }
    updateContact() {
      const changeUser = document.querySelectorAll('#convert-entity');
      changeUser.forEach((buttonKey) => {
            buttonKey.addEventListener('click', async () => {
                let entityId = buttonKey.dataset.entityid;
                this.dialogContainer.style.display = 'block';
                this.dialogContainer.innerHTML = UIContact;
                inputObserver();
                const _contactName= document.getElementById('entity-contact-name');
                const _contactPhone = document.getElementById('entity-contact-phone');
                const data = await getEntityData("Customer", entityId);
                _contactName.value = data.contact?.name ?? "";
                _contactPhone.value = data.contact?.phone ?? "";
                const _updateContactButton = document.getElementById('update-contact');
                const _closeButton = document.getElementById('cancel');
                const _dialog = document.getElementById('dialog-content');
                _updateContactButton.addEventListener('click', async () => {
                    if (_contactName.value === '') {
                        alert('El campo Nombre no puede estar vacío.');
                    }
                    else if (_contactPhone.value === '') {
                        alert('El campo Teléfono no puede estar vacío.');
                    }
                    else if (data.contact?.id === '' || data.contact?.id === null || data.contact?.id === undefined) {
                        let raw = JSON.stringify({
                            "name": `${_contactName.value}`,
                            "phone": `${_contactPhone.value}`
                        });
                        if(!infoPage.actions.includes("UPD") && !Config.currentUser?.isMaster){
                          alert("Usuario no tiene permiso de actualizar.");
                        }else{
                          await registerEntity(raw, 'Contact')
                              .then(() => {
                              setTimeout(async () => {
                                let rawSearch = JSON.stringify({
                                  "filter": {
                                      "conditions": [
                                          {
                                              "property": "name",
                                              "operator": "=",
                                              "value": `${_contactName.value}`
                                          },
                                          {
                                              "property": "phone",
                                              "operator": "=",
                                              "value": `${_contactPhone.value}`
                                          }
                                      ]
                                  }
                                });
                                let contactData = await getFilterEntityData("Contact", rawSearch);
                                console.log(contactData);
                                contactData.forEach(async (newContact) => {
                                  let rawCustomer = JSON.stringify({
                                    "contact": {
                                        "id": `${newContact.id}`
                                    },
                                  });
                                  await updateEntity('Customer', entityId, rawCustomer)
                                      .then(() => {
                                      setTimeout(() => {
                                          new CloseDialog().x(_dialog);
                                      }, 1000);
                                  });
                                });
                              }, 1000);
                          });
                        }

                    }
                    else {
                      let raw = JSON.stringify({
                        "name": `${_contactName.value}`,
                        "phone": `${_contactPhone.value}`
                      });
                      if(!infoPage.actions.includes("UPD") && !Config.currentUser?.isMaster){
                        alert("Usuario no tiene permiso de actualizar.");
                      }else{
                        await updateEntity('Contact', data.contact.id, raw)
                            .then(() => {
                            setTimeout(() => {
                                new CloseDialog().x(_dialog);
                            }, 1000);
                        });
                      }
                    }
                });
                _closeButton.onclick = () => {
                    new CloseDialog().x(_dialog);
                };
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

