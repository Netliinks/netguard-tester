// @filename: locations.ts
import { deleteEntity, getEntitiesData, registerEntity, updateEntity, getEntityData, getFilterEntityData, getFilterEntityCount, getUserInfo } from "../../../../endpoints.js";
import { inputObserver, inputSelect, CloseDialog, filterDataByHeaderType, pageNumbers, fillBtnPagination, currentDateTime, getDetails, getDetails2 } from "../../../../tools.js";
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
  msgPermission: "",
  actions: []
};
let dataPage;
let routine;
const currentBusiness = async() => {
    //const currentUser = await getUserInfo();
    //const userid = await getEntityData('User', `${currentUser.attributes.id}`);
    return Config.currentUser;
}
const getUsers = async (routineId) => {
    //nombre de la entidad
    /*const location = await getEntitiesData('Location');
    const FCustomer = location.filter((data) => `${data.customer?.id}` === `${customerId}`);
    return FCustomer;*/
    routine = await getEntityData("Routine", routineId)
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
                                    "property": "user.username",
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
        infoPage.count = await getFilterEntityCount("RoutineUser", raw);
        dataPage = await getFilterEntityData("RoutineUser", raw);
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
export class RoutineUsers {
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
              new RoutineUsers().render(Config.offset, Config.currentPage, search.value.toLowerCase().trim(), routine.id);
            });
        };
    }

    async render(offset, actualPage, search, routineId, actions) {
        infoPage.offset = offset;
        infoPage.currentPage = actualPage;
        infoPage.search = search;
        infoPage.actions = actions;
        this.content.innerHTML = '';
        this.content.innerHTML = tableLayout;
        const tableBody = document.getElementById('datatable-body');
        const subtitle = document.getElementById('datatable_subtitle')  
        tableBody.innerHTML = '.Cargando...';
        let data = await getUsers(routineId);
        subtitle.innerText = `Rutina: ${routine.name}`
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
                let guard = paginatedItems[i];
                let row = document.createElement('tr');
                row.innerHTML += `
          <td>${guard.user.username}</dt>
          <td>${guard.creationDate} ${guard.creationTime}</dt>
          <td>${guard.createdBy}</dt>
          <td class="entity_options">
            <button class="button" id="remove-entity" data-entityId="${guard.id}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </dt>
        `;
                table.appendChild(row);
            }
        }
        this.register();
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
                new RoutineUsers().render(infoPage.offset, currentPage, infoPage.search, routine.id);
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
              new RoutineUsers().render(Config.offset, Config.currentPage, infoPage.search, routine.id);
          });
          nextButton.addEventListener('click', () => {
              infoPage.offset = Config.tableRows * (pageCount - 1);
              new RoutineUsers().render(infoPage.offset, pageCount, infoPage.search, routine.id);
          });
      }
    }
    register() {
        // register entity
        const openEditor = document.getElementById('new-entity');
        openEditor.addEventListener('click', () => {
            if(infoPage.actions.includes("INS") || Config.currentUser?.isMaster){
                modalTable(0, "");
            }else{
                alert("Usuario no tiene permiso de registrar.");
            }
        });
        async function modalTable(offset, search) {
          const dialogContainer = document.getElementById('app-dialogs');
          //const guards = await getDetails('routine.id', routine.id, 'RoutineUser');
          let raw = JSON.stringify({
              "filter": {
                  "conditions": [
                      {
                          "property": "customer.id",
                          "operator": "=",
                          "value": `${customerId}`
                      },
                      {
                          "property": "state.name",
                          "operator": "=",
                          "value": `Enabled`
                      },
                      {
                          "property": "userType",
                          "operator": "=",
                          "value": `GUARD`
                      },
                      {
                          "property": "isSuper",
                          "operator": "=",
                          "value": `${false}`
                      },
                  ],
              },
              sort: "+username",
              limit: Config.modalRows,
              offset: offset,
              fetchPlan: 'full',
          });
          if (search != "") {
              raw = JSON.stringify({
                  "filter": {
                      "conditions": [
                          {
                              "group": "OR",
                              "conditions": [
                                  {
                                      "property": "firstName",
                                      "operator": "contains",
                                      "value": `${search.toLowerCase()}`
                                  },
                                  {
                                      "property": "lastName",
                                      "operator": "contains",
                                      "value": `${search.toLowerCase()}`
                                  },
                                  {
                                      "property": "secondLastName",
                                      "operator": "contains",
                                      "value": `${search.toLowerCase()}`
                                  },
                                  {
                                      "property": "username",
                                      "operator": "contains",
                                      "value": `${search.toLowerCase()}`
                                  },
                                  {
                                      "property": "dni",
                                      "operator": "contains",
                                      "value": `${search.toLowerCase()}`
                                  }
                              ]
                          },
                          {
                              "property": "customer.id",
                              "operator": "=",
                              "value": `${customerId}`
                          },
                          {
                              "property": "state.name",
                              "operator": "=",
                              "value": `Enabled`
                          },
                          {
                              "property": "userType",
                              "operator": "=",
                              "value": `GUARD`
                          },
                          {
                              "property": "isSuper",
                              "operator": "=",
                              "value": `${false}`
                          },
                      ],
                  },
                  sort: "+username",
                  limit: Config.modalRows,
                  offset: offset,
                  fetchPlan: 'full',
              });
          }
          let dataModal = await getFilterEntityData("User", raw);
          dialogContainer.style.display = 'block';
          dialogContainer.innerHTML = `
                <div class="dialog_content" id="dialog-content">
                    <div class="dialog">
                        <div class="dialog_container padding_8">
                            <div class="dialog_header">
                                <h2>Asignar guardias a rutina</h2>
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
                                        <th></th>
                                        <th>Nombre</th>
                                        <th>Usuario</th>
                                        <th>DNI</th>
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
                  let client = dataModal[i];
                  let row = document.createElement('tr');
                  row.innerHTML += `
                      <td><input type="checkbox" id="entity-check" data-entityId="${client.id}"></td>
                      <td>${client?.firstName ?? ''} ${client?.lastName ?? ''} ${client?.secondLastName ?? ''}</td>
                      <td>${client?.username ?? ''}</td>
                      <td>${client?.dni ?? ''}</td>
                  `;
                  datetableBody.appendChild(row);
              }
          }
          const txtSearch = document.getElementById('search-modal');
          const btnSearchModal = document.getElementById('btnSearchModal');
          const _selectUser = document.querySelectorAll('#entity-check');
          const _closeButton = document.getElementById('cancel');
          const _saveButton = document.getElementById('saveModal');
          const _dialog = document.getElementById('dialog-content');
          const prevModalButton = document.getElementById('prevModal');
          const nextModalButton = document.getElementById('nextModal');
          const businessData = await currentBusiness();
          txtSearch.value = search ?? '';
          _selectUser.forEach(async (select) => {
            const entityId = select.dataset.entityid;
            const existGuard = await getDetails2('routine.id', routine.id, 'user.id', entityId, 'RoutineUser');
            if(existGuard.length != 0){
              select.style.display = "none";
              select.disabled = true;
            }
          });
          btnSearchModal.onclick = () => {
              modalTable(0, txtSearch.value);
          };
          _closeButton.onclick = () => {
              new CloseDialog().x(_dialog);
          };
          _saveButton.onclick = () => {
            if(!infoPage.actions.includes("INS") && !Config.currentUser?.isMaster){
                alert("Usuario no tiene permiso de registrar.");
            }else{
                _selectUser.forEach(async (select) => {
                if(select.checked){
                    const entityId = select.dataset.entityid;
                    const existGuard = await getDetails2('routine.id', routine.id, 'user.id', entityId, 'RoutineUser');
                    if(existGuard.length == 0){
                    const raw = JSON.stringify({ 
                        "business": {
                            "id": `${businessData.business.id}`
                        },                 
                        "customer": {
                            "id": `${customerId}`
                        },
                        "routine": {
                        "id": `${routine.id}`
                        },
                        "user": {
                        "id": `${entityId}`
                        },
                        'creationDate': `${currentDateTime().date}`,
                        'creationTime': `${currentDateTime().timeHHMMSS}`,
                    });
                    registerEntity(raw, 'RoutineUser').then((res) => {
                        setTimeout(() => {
                            new CloseDialog().x(_dialog);
                            new RoutineUsers().render(Config.offset, Config.currentPage, infoPage.search, routine.id);
                        }, 1000);
                    });
                    }
                    
                }
                
                
                });
            }
        };
          nextModalButton.onclick = () => {
              offset = Config.modalRows + (offset);
              modalTable(offset, search);
          };
          prevModalButton.onclick = () => {
            if(offset > 0){
                offset = offset - Config.modalRows;
                modalTable(offset, search);
            }
          };
      }

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
                    <h2>¿Deseas eliminar este guardia de la rutina?</h2>
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
                            deleteEntity('RoutineUser', entityId)
                                .then(res => new RoutineUsers().render(infoPage.offset, infoPage.currentPage, infoPage.search, routine.id));
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
