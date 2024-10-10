// @filename: locations.ts
import { deleteEntity, getEntitiesData, registerEntity, updateEntity, getEntityData, getFilterEntityData, getFilterEntityCount, getUserInfo } from "../../../../endpoints.js";
import { inputObserver, inputSelect, CloseDialog, filterDataByHeaderType, pageNumbers, fillBtnPagination, currentDateTime, getDetails, getDetails2, getPermissions } from "../../../../tools.js";
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
  search: "",
  modalRows: 15,
  msgPermission: "",
  actions: []
};
let dataPage;
let user;
const currentBusiness = async() => {
    //const currentUser = await getUserInfo();
    //const userid = await getEntityData('User', `${currentUser.attributes.id}`);
    return Config.currentUser;
}
const getUserPermissions = async (userId) => {
    //nombre de la entidad
    /*const location = await getEntitiesData('Location');
    const FCustomer = location.filter((data) => `${data.customer?.id}` === `${customerId}`);
    return FCustomer;*/
    user = await getEntityData("User", userId)
    const response = async () => {
        let raw = JSON.stringify({
            "filter": {
                "conditions": [
                    {
                        "property": "customer.id",
                        "operator": "=",
                        "value": `${customerId}`
                    },
                    {
                        "property": "user.id",
                        "operator": "=",
                        "value": `${userId}`
                    },
                ],
            },
            sort: "+module.identifier",
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
                                    "property": "module.name",
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
                            "property": "user.id",
                            "operator": "=",
                            "value": `${user.id}`
                        },
                    ]
                },
                sort: "+module.identifier",
                limit: Config.tableRows,
                offset: infoPage.offset,
                fetchPlan: 'full',
            });
        }
        infoPage.count = await getFilterEntityCount("Permission", raw);
        dataPage = await getFilterEntityData("Permission", raw);
        return dataPage;
    }
    if(Config.currentUser?.isMaster){
        return response();
    }else{
        if(infoPage.actions.includes("READ")){
            return response();
        }else{
            infoPage.msgPermission = "Usuario no tiene permiso de lectura.";
            infoPage.count = 0;
            return [];
        }
    }
};
export class UserPermissions {
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
              new UserPermissions().render(Config.offset, Config.currentPage, search.value.toLowerCase().trim(), user.id, infoPage.actions);
            });
        };
    }

    async render(offset, actualPage, search, userId, actions) {
        infoPage.offset = offset;
        infoPage.currentPage = actualPage;
        infoPage.search = search;
        infoPage.actions = actions;
        this.content.innerHTML = '';
        this.content.innerHTML = tableLayout;
        const tableBody = document.getElementById('datatable-body');
        const subtitle = document.getElementById('datatable_subtitle')  
        tableBody.innerHTML = '.Cargando...';
        let data = await getUserPermissions(userId);
        subtitle.innerText = `${user.username}`
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
                let register = paginatedItems[i];
                let row = document.createElement('tr');
                row.innerHTML += `
          <td>${register.module?.identifier ?? ''}</dt>
          <td>${this.getActions(register?.actionsText ?? '')}</dt>
          <td>${register?.creationDate ?? ''} ${register?.creationTime ?? ''}</dt>
          <td class="entity_options">
            <button class="button" id="edit-entity" data-entityId="${register.id}">
              <i class="fa-solid fa-pen"></i>
            </button>

            <button class="button" id="remove-entity" data-entityId="${register.id}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </dt>
        `;
                table.appendChild(row);
            }
        }
        this.register();
        this.edit(this.entityDialogContainer, data);
        this.remove();

    }
    getActions(actions){
        const arrayActions = actions.split(';');
        let actionNames = [];
        for(let i=0;i<arrayActions.length;i++){
            switch (arrayActions[i]) {
                case 'READ':
                    actionNames.push("LEER"); 
                    break;
                case 'INS':
                    actionNames.push("REGISTRAR");
                    break;
                case 'UPD':
                    actionNames.push("EDITAR");
                    break;
                case 'DLT':
                    actionNames.push("ELIMINAR");
                    break;
                case 'DWN':
                    actionNames.push("EXPORTAR");
                    break;
            
                default:
                    actionNames.push(arrayActions[i]);
                    break;
            }
        }
        return actionNames;
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
                new UserPermissions().render(infoPage.offset, currentPage, infoPage.search, user.id, infoPage.actions);
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
              new UserPermissions().render(Config.offset, Config.currentPage, infoPage.search, user.id, infoPage.actions);
          });
          nextButton.addEventListener('click', () => {
              infoPage.offset = Config.tableRows * (pageCount - 1);
              new UserPermissions().render(infoPage.offset, pageCount, infoPage.search, user.id, infoPage.actions);
          });
      }
    }
    register() {
        let pressed = false;
        // register entity
        const openEditor = document.getElementById('new-entity');
        openEditor.addEventListener('click', () => {
            pressed = false;
            if((infoPage.actions.includes("INS") || infoPage.actions.includes("UPD")) || Config.currentUser?.isMaster){
                modalTable(0, "");
            }else{
                alert("Usuario no tiene permiso de registrar o editar.");
            }
        });
        async function modalTable(offset, search) {
          const dialogContainer = document.getElementById('app-dialogs');
          //const guards = await getDetails('routine.id', routine.id, 'RoutineUser');
          let raw = JSON.stringify({
              "filter": {
                  "conditions": [],
              },
              sort: "+identifier",
              limit: infoPage.modalRows,
              offset: offset
          });
          if (search != "") {
              raw = JSON.stringify({
                  "filter": {
                      "conditions": [
                          {
                              "group": "OR",
                              "conditions": [
                                  {
                                      "property": "identifier",
                                      "operator": "contains",
                                      "value": `${search.toLowerCase()}`
                                  }
                              ]
                          }
                      ],
                  },
                  sort: "+identifier",
                  limit: infoPage.modalRows,
                  offset: offset
              });
          }
          let dataModal = await getFilterEntityData("Module_", raw);
          dialogContainer.style.display = 'block';
          dialogContainer.innerHTML = `
                <div class="dialog_content" id="dialog-content">
                    <div class="dialog">
                        <div class="dialog_container padding_8">
                            <div class="dialog_header">
                                <h2>Módulos a agregar permisos</h2>
                            </div>

                            <div class="dialog_message padding_8">
                                <div class="datatable_tools">
                                    <input type="search"
                                    class="search_input"
                                    placeholder="Buscar"
                                    id="search-modal">
                                    <button
                                        class="datatable_button add_user"
                                        id="btnSearchModal">
                                        <i class="fa-solid fa-search"></i>
                                    </button>
                                </div>
                                <div class="dashboard_datatable">
                                    <table class="datatable_content margin_t_16">
                                    <thead>
                                        <tr>
                                        <th>Nombre</th>
                                        <th>Activo</th>
                                        <th>Acciones</th>
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
                                <button class="btn btn_primary" id="saveModal">Guardar</button>
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
                  let moduleData = dataModal[i];
                  let row = document.createElement('tr');
                  row.innerHTML += `
                      <td>${moduleData?.identifier ?? ''}</td>
                      <td>${moduleData?.active ? 'Si' : 'No'}</td>
                      <td id="actionsMenu${i}"></td>

                  `;
                  datetableBody.appendChild(row);
                  let td = document.getElementById(`actionsMenu${i}`);
                  if(moduleData?.name === 'CUSTOMER_CHANGE'){
                    td.innerHTML = `
                        <input type="checkbox" id="entity-check-change" data-entityId="${moduleData.id}">
                        <label for="entity-check-change"> Cambiar Empresa</label>
                    `;
                  }else{
                    td.innerHTML = `
                        <input type="checkbox" id="entity-check-register" data-entityId="${moduleData.id}">
                        <label for="entity-check-register"> Registrar</label>
                        <input type="checkbox" id="entity-check-update" data-entityId="${moduleData.id}">
                        <label for="entity-check-update"> Editar</label>
                        <input type="checkbox" id="entity-check-read" data-entityId="${moduleData.id}">
                        <label for="entity-check-read"> Leer</label>
                        <input type="checkbox" id="entity-check-delete" data-entityId="${moduleData.id}">
                        <label for="entity-check-delete"> Eliminar</label>
                        <input type="checkbox" id="entity-check-export" data-entityId="${moduleData.id}">
                        <label for="entity-check-export"> Exportar</label>
                        `;
                  }
              }
          }
          const txtSearch = document.getElementById('search-modal');
          const btnSearchModal = document.getElementById('btnSearchModal');
          const _checkRegisters = document.querySelectorAll('#entity-check-register');
          const _checkUpdates = document.querySelectorAll('#entity-check-update');
          const _checkReads = document.querySelectorAll('#entity-check-read');
          const _checkDeletes = document.querySelectorAll('#entity-check-delete');
          const _checkExports = document.querySelectorAll('#entity-check-export');
          const _checkChanges = document.querySelectorAll('#entity-check-change');
          const _closeButton = document.getElementById('cancel');
          const _saveButton = document.getElementById('saveModal');
          const _dialog = document.getElementById('dialog-content');
          const prevModalButton = document.getElementById('prevModal');
          const nextModalButton = document.getElementById('nextModal');
          const businessData = await currentBusiness();
          txtSearch.value = search ?? '';
          const permisos = await getPermissions(user.id);
          let itemsIns = [];
          let itemsUpd = [];
          let itemsRead = [];
          let itemsDlt = [];
          let itemsDwn = [];
          let itemsChange = [];
          if(permisos.code === 3){
            for(let i=0;i<permisos.message.length;i++){
                let acciones = permisos.message[i].actionsText.split(';');
                if(acciones.includes("INS")){
                    itemsIns.push(permisos.message[i].module.id);
                }

                if(acciones.includes("UPD")){
                    itemsUpd.push(permisos.message[i].module.id);
                }

                if(acciones.includes("READ")){
                    itemsRead.push(permisos.message[i].module.id);
                }

                if(acciones.includes("DLT")){
                    itemsDlt.push(permisos.message[i].module.id);
                }

                if(acciones.includes("DWN")){
                    itemsDwn.push(permisos.message[i].module.id);
                }

                if(acciones.includes("CHANGE")){
                    itemsChange.push(permisos.message[i].module.id);
                }
            }
            _checkRegisters.forEach(async (select) => {
                const entityId = select.dataset.entityid;
                if(itemsIns.includes(entityId.trim())){
                    select.checked = true;
                    select.disabled = true;
                    //select.style.display = "none";
                    //_checkUpdates.forEach(async (select1) => {if(select1.dataset.entityid.includes(entityId.trim())){select1.disabled = true; select1.style.display = "none";}});
                    //_checkReads.forEach(async (select2) => {if(select2.dataset.entityid.includes(entityId.trim())){select2.disabled = true; select2.style.display = "none";}});
                    //_checkDeletes.forEach(async (select3) => {if(select3.dataset.entityid.includes(entityId.trim())){select3.disabled = true; select3.style.display = "none";}});
                    //_checkExports.forEach(async (select4) => {if(select4.dataset.entityid.includes(entityId.trim())){select4.disabled = true; select4.style.display = "none";}});
                }
            });
            _checkUpdates.forEach(async (select) => {
                const entityId = select.dataset.entityid;
                if(itemsUpd.includes(entityId.trim())){
                    select.checked = true;
                    select.disabled = true;
                    //select.style.display = "none";
                    //_checkRegisters.forEach(async (select1) => {if(select1.dataset.entityid.includes(entityId.trim())){select1.disabled = true; select1.style.display = "none";}});
                    //_checkReads.forEach(async (select2) => {if(select2.dataset.entityid.includes(entityId.trim())){select2.disabled = true; select2.style.display = "none";}});
                    //_checkDeletes.forEach(async (select3) => {if(select3.dataset.entityid.includes(entityId.trim())){select3.disabled = true; select3.style.display = "none";}});
                    //_checkExports.forEach(async (select4) => {if(select4.dataset.entityid.includes(entityId.trim())){select4.disabled = true; select4.style.display = "none";}});
                }
            });
            _checkReads.forEach(async (select) => {
                const entityId = select.dataset.entityid;
                if(itemsRead.includes(entityId.trim())){
                    select.checked = true;
                    select.disabled = true;
                    //select.style.display = "none";
                    //_checkRegisters.forEach(async (select1) => {if(select1.dataset.entityid.includes(entityId.trim())){select1.disabled = true; select1.style.display = "none";}});
                    //_checkUpdates.forEach(async (select2) => {if(select2.dataset.entityid.includes(entityId.trim())){select2.disabled = true; select2.style.display = "none";}});
                    //_checkDeletes.forEach(async (select3) => {if(select3.dataset.entityid.includes(entityId.trim())){select3.disabled = true; select3.style.display = "none";}});
                    //_checkExports.forEach(async (select4) => {if(select4.dataset.entityid.includes(entityId.trim())){select4.disabled = true; select4.style.display = "none";}});
                }
            });
            _checkDeletes.forEach(async (select) => {
                const entityId = select.dataset.entityid;
                if(itemsDlt.includes(entityId.trim())){
                    select.checked = true;
                    select.disabled = true;
                    //select.style.display = "none";
                    //_checkRegisters.forEach(async (select1) => {if(select1.dataset.entityid.includes(entityId.trim())){select1.disabled = true; select1.style.display = "none";}});
                    //_checkUpdates.forEach(async (select2) => {if(select2.dataset.entityid.includes(entityId.trim())){select2.disabled = true; select2.style.display = "none";}});
                    //_checkReads.forEach(async (select3) => {if(select3.dataset.entityid.includes(entityId.trim())){select3.disabled = true; select3.style.display = "none";}});
                    //_checkExports.forEach(async (select4) => {if(select4.dataset.entityid.includes(entityId.trim())){select4.disabled = true; select4.style.display = "none";}});
                }
            });
            _checkExports.forEach(async (select) => {
                const entityId = select.dataset.entityid;
                if(itemsDwn.includes(entityId.trim())){
                    select.checked = true;
                    select.disabled = true;
                    //select.style.display = "none";
                    //_checkRegisters.forEach(async (select1) => {if(select1.dataset.entityid.includes(entityId.trim())){select1.disabled = true; select1.style.display = "none";}});
                    //_checkUpdates.forEach(async (select2) => {if(select2.dataset.entityid.includes(entityId.trim())){select2.disabled = true; select2.style.display = "none";}});
                    //_checkReads.forEach(async (select3) => {if(select3.dataset.entityid.includes(entityId.trim())){select3.disabled = true; select3.style.display = "none";}});
                    //_checkDeletes.forEach(async (select4) => {if(select4.dataset.entityid.includes(entityId.trim())){select4.disabled = true; select4.style.display = "none";}});
                }
            });
            _checkChanges.forEach(async (select) => {
                const entityId = select.dataset.entityid;
                if(itemsChange.includes(entityId.trim())){
                    select.checked = true;
                    select.disabled = true;
                    //select.style.display = "none";
                }
            });
            
          }else{
                alert(permisos.message);
          }
          
          btnSearchModal.onclick = () => {
              modalTable(0, txtSearch.value);
          };
          _closeButton.onclick = () => {
              new CloseDialog().x(_dialog);
          };
          _saveButton.onclick = () => {
            pressed = true;
            let okIns = true;
            let okUpd = true;
            if(pressed){
                if(!infoPage.actions.includes("INS") && !Config.currentUser?.isMaster){
                    okIns = false;
                }
                if(!infoPage.actions.includes("UPD") && !Config.currentUser?.isMaster){
                    okUpd = false;
                }

                if(!okIns && !okUpd){
                    alert("Usuario no tiene permiso de registrar o editar.");
                }else{
                    let newRegisters = {};
                    _checkRegisters.forEach(async (select) => {
                        const entityId = select.dataset.entityid;
                        if(select.checked && !itemsIns.includes(entityId.trim())){
                            if (newRegisters[entityId]) {
                                newRegisters[entityId].push({acc:'INS'});
                            } else {
                                newRegisters[entityId] = [{acc:'INS'}];
                            }
                        }
                    });
                    _checkUpdates.forEach(async (select) => {
                        const entityId = select.dataset.entityid;
                        if(select.checked && !itemsUpd.includes(entityId.trim())){
                            if (newRegisters[entityId]) {
                                newRegisters[entityId].push({acc:'UPD'});
                            } else {
                                newRegisters[entityId] = [{acc:'UPD'}];
                            }
                        }
                    });
                    _checkReads.forEach(async (select) => {
                        const entityId = select.dataset.entityid;
                        if(select.checked && !itemsRead.includes(entityId.trim())){
                            if (newRegisters[entityId]) {
                                newRegisters[entityId].push({acc:'READ'});
                            } else {
                                newRegisters[entityId] = [{acc:'READ'}];
                            }
                        }
                    });
                    _checkDeletes.forEach(async (select) => {
                        const entityId = select.dataset.entityid;
                        if(select.checked && !itemsDlt.includes(entityId.trim())){
                            if (newRegisters[entityId]) {
                                newRegisters[entityId].push({acc:'DLT'});
                            } else {
                                newRegisters[entityId] = [{acc:'DLT'}];
                            }
                        }
                    });
                    _checkExports.forEach(async (select) => {
                        const entityId = select.dataset.entityid;
                        if(select.checked && !itemsDwn.includes(entityId.trim())){
                            if (newRegisters[entityId]) {
                                newRegisters[entityId].push({acc:'DWN'});
                            } else {
                                newRegisters[entityId] = [{acc:'DWN'}];
                            }
                        }
                    });
                    _checkChanges.forEach(async (select) => {
                        const entityId = select.dataset.entityid;
                        if(select.checked && !itemsChange.includes(entityId.trim())){
                            if (newRegisters[entityId]) {
                                newRegisters[entityId].push({acc:'CHANGE'});
                            } else {
                                newRegisters[entityId] = [{acc:'CHANGE'}];
                            }
                        }
                    });

                    let key = Object.keys(newRegisters)
                    for(let i = 0; i < key.length; i++){
                        let objects = newRegisters[key[i]]
                        let listActions = [];
                        //console.log(key[i])
                        //console.log(objects)
                        //console.log(objects.length)

                        objects.map(element => {
                            listActions.push(element.acc);
                        });

                        listActions = listActions.toString().replaceAll(",",";");
                        let checkModule = permisos.message.filter((data) => `${data?.module?.id}` === `${key[i]}`);
                        if(checkModule.length !== 0){
                            //Si esta se actualiza
                            if(okUpd){
                                let updateActions = checkModule[0]?.actionsText ?? '';
                                updateActions = updateActions !== '' ? `${updateActions};${listActions}` : `${listActions}`;
                                let raw = JSON.stringify({ 
                                    'actionsText': `${updateActions}`,
                                });
                                updateEntity('Permission', checkModule[0].id, raw);
                            }
                        }else if(checkModule.length === 0){
                            //si no esta se crea
                            if(okIns){
                                let raw = JSON.stringify({ 
                                    "business": {
                                        "id": `${businessData.business.id}`
                                    },                 
                                    "customer": {
                                        "id": `${customerId}`
                                    },
                                    "user": {
                                        "id": `${user.id}`
                                    },
                                    "module": {
                                        "id": `${key[i]}`
                                    },
                                    'actionsText': `${listActions}`,
                                    'creationDate': `${currentDateTime().date}`,
                                    'creationTime': `${currentDateTime().timeHHMMSS}`,
                                });
                                registerEntity(raw, 'Permission');
                            }
                        }
                    }
                    if(!okIns)
                        alert("Usuario no tiene permiso para registrar.");

                    if(!okUpd)
                        alert("Usuario no tiene permiso para editar.");

                    setTimeout(() => {
                        new CloseDialog().x(_dialog);
                        new UserPermissions().render(Config.offset, Config.currentPage, infoPage.search, user.id, infoPage.actions);
                    }, 1000);
                }
            }
        };
          nextModalButton.onclick = () => {
              offset = infoPage.modalRows + (offset);
              modalTable(offset, search);
          };
          prevModalButton.onclick = () => {
            if(offset > 0){
                offset = offset - infoPage.modalRows;
                modalTable(offset, search);
            }
          };
      }

    }
    edit(container, data) {
        // Edit entity
        const edit = document.querySelectorAll('#edit-entity');
        edit.forEach((edit) => {
            const entityId = edit.dataset.entityid;
            edit.addEventListener('click', () => {
                RInterface('Permission', entityId);
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
              <div class="avatar"><i class="fa-regular fa-user"></i></div>
              <h1 class="entity_editor_title">Editar <br><small>Permiso</small></h1>
            </div>

            <button class="btn btn_close_editor" id="close"><i class="fa-solid fa-x"></i></button>
          </div>

          <!-- EDITOR BODY -->
          <div class="entity_editor_body">
            <div class="material_input">
              <input type="text"
                id="entity-module"
                class="input_filled"
                value="${data?.module?.identifier ?? ''}" disabled>
              <label for="entity-module">Módulo</label>
            </div>

            <div id="checkBoxs"></div>

            <br>
            <br>

            <div class="input_detail">
                <label for="creation-date"><i class="fa-solid fa-calendar"></i></label>
                <input type="date" id="creation-date" class="input_filled" value="${data?.creationDate ?? ''}" readonly>
            </div>
            <br>
            <div class="input_detail">
                <label for="creation-time"><i class="fa-solid fa-clock"></i></label>
                <input type="time" id="creation-time" class="input_filled" value="${data?.creationTime ?? ''}" readonly>
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
            inputObserver();
            const checkboxs = document.getElementById('checkBoxs');
            if(data?.module?.name !== 'CUSTOMER_CHANGE'){
                checkboxs.innerHTML = `
                <div class="input_checkbox">
                    <label><input type="checkbox" class="checkbox" id="entity-ins"> Registrar</label>
                </div>

                <div class="input_checkbox">
                    <label><input type="checkbox" class="checkbox" id="entity-upd"> Editar</label>
                </div>

                <div class="input_checkbox">
                    <label><input type="checkbox" class="checkbox" id="entity-read"> Leer</label>
                </div>

                <div class="input_checkbox">
                    <label><input type="checkbox" class="checkbox" id="entity-dlt"> Eliminar</label>
                </div>
                `;
                const actions = data?.actionsText.split(';');
                const checkbox1 = document.getElementById('entity-ins');
                const checkbox2 = document.getElementById('entity-upd');
                const checkbox3 = document.getElementById('entity-read');
                const checkbox4 = document.getElementById('entity-dlt');
                if (actions.includes('INS')) {
                    checkbox1?.setAttribute('checked', 'true');
                }
                if (actions.includes('UPD')) {
                    checkbox2?.setAttribute('checked', 'true');
                }
                if (actions.includes('READ')) {
                    checkbox3?.setAttribute('checked', 'true');
                }
                if (actions.includes('DLT')) {
                    checkbox4?.setAttribute('checked', 'true');
                }
            }else{
                checkboxs.innerHTML = `
                <div class="input_checkbox">
                    <label><input type="checkbox" class="checkbox" id="entity-change"> Cambiar empresa</label>
                </div>
                `;
                const actions = data?.actionsText.split(';');
                const checkbox1 = document.getElementById('entity-change');
                if (actions.includes('CHANGE')) {
                    checkbox1?.setAttribute('checked', 'true');
                }
            }
            
            this.close();
            UUpdate(entityID);
        };
        const UUpdate = async (entityId) => {
            const updateButton = document.getElementById('update-changes');
            updateButton.addEventListener('click', async() => {
                const $value = {
                    ins: document.getElementById('entity-ins'),
                    upd: document.getElementById('entity-upd'),
                    read: document.getElementById('entity-read'),
                    dlt: document.getElementById('entity-dlt'),
                    change: document.getElementById('entity-change'),
                };
                let actions = [];
                if($value.change === null){
                    if($value.ins.checked){
                        actions.push('INS');
                    }
                    if($value.upd.checked){
                        actions.push('UPD');
                    }
                    if($value.read.checked){
                        actions.push('READ');
                    }
                    if($value.dlt.checked){
                        actions.push('DLT');
                    }
                }else{
                    if($value.change.checked){
                        actions.push('CHANGE');
                    }
                }
                let raw = JSON.stringify({
                    "actionsText": `${actions.toString().replaceAll(",",";")}`
                });
                
                if(!infoPage.actions.includes("UPD") && !Config.currentUser?.isMaster){
                    alert("Usuario no tiene permiso de actualizar.");
                }else{
                    update(raw);
                }
            });
            const update = (raw) => {
              updateEntity('Permission', entityId, raw)
                  .then((res) => {
                  setTimeout(async () => {
                      let tableBody;
                      let container;
                      let data;
                      //data = await getUsers(SUser);
                      new CloseDialog()
                          .x(container =
                          document.getElementById('entity-editor-container'));
                      new UserPermissions().render(infoPage.offset, infoPage.currentPage, infoPage.search, user.id, infoPage.actions);
                  }, 100);
              });
            };
        };
    }
    remove() {
        const remove = document.querySelectorAll('#remove-entity');
        remove.forEach((remove) => {
            const entityId = remove.dataset.entityid;
            remove.addEventListener('click', () => {
                if(!infoPage.actions.includes("DLT") && !Config.currentUser?.isMaster){
                    alert("Usuario no tiene permiso de eliminar.");
                }else{
                    this.dialogContainer.style.display = 'flex';
                    this.dialogContainer.innerHTML = `
            <div class="dialog_content" id="dialog-content">
                <div class="dialog dialog_danger">
                <div class="dialog_container">
                    <div class="dialog_header">
                    <h2>¿Deseas eliminar este oermiso?</h2>
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
                        if(!infoPage.actions.includes("DLT") && !Config.currentUser?.isMaster){
                            alert("Usuario no tiene permiso de eliminar.");
                        }else{
                            deleteEntity('Permission', entityId)
                                .then(res => new UserPermissions().render(infoPage.offset, infoPage.currentPage, infoPage.search, user.id, infoPage.actions));
                            new CloseDialog().x(dialogContent);
                        }
                    };
                    cancelButton.onclick = () => {
                        new CloseDialog().x(dialogContent);
                    };
                }
            });
        });
    }
    close() {
        const closeButton = document.getElementById('close');
        const editor = document.getElementById('entity-editor-container');
        closeButton.addEventListener('click', () => {
            console.log('close');
            new CloseDialog().x(editor);
        });
    }
}
