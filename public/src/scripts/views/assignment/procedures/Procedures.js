// @filename: Procedures.ts
import { deleteEntity, getEntitiesData, registerEntity, updateEntity, setFile, getUserInfo, getFile, getFilterEntityCount,getFilterEntityData } from "../../../endpoints.js";
import { inputObserver, inputSelect, CloseDialog, filterDataByHeaderType ,fillBtnPagination, getPermission} from "../../../tools.js";
import { Config } from "../../../Configs.js";
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
const getProcedures = async () => {
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
            "property": "user.userType",
            "operator": "=",
            "value": `GUARD`
          }
        ],
      },
      sort: "+name",
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
              "property": "user.userType",
              "operator": "=",
              "value": `GUARD`
            }
          ]
        },
        sort: "+name",
        limit: Config.tableRows,
        offset: infoPage.offset,
        fetchPlan: 'full',
      });
    }
    infoPage.count = await getFilterEntityCount("Procedure_", raw);
    dataPage = await getFilterEntityData("Procedure_", raw);
    return dataPage;
  }
  if(Config.currentUser?.isMaster){
    return response();
  }else{
    const permission = await getPermission('PROCEDURE', Config.currentUser.id);
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
export class Procedures {
  constructor() {
    this.dialogContainer = document.getElementById('app-dialogs');
    this.entityDialogContainer = document.getElementById('entity-editor-container');
    this.content = document.getElementById('datatable-container');
    this.searchEntity = async (tableBody /*, data: any*/) => {
      const search = document.getElementById('search');
      const btnSearch = document.getElementById('btnSearch');
      search.value = infoPage.search;
      await search.addEventListener('keyup', () => {

      });
      btnSearch.addEventListener('click', async () => {
        new Procedures().render(Config.offset, Config.currentPage, search.value.toLowerCase().trim());
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
    let data = await getProcedures();
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
      if (customerId == null) { mensaje = 'Seleccione una empresa'; }
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
        let procedure = paginatedItems[i];
        let row = document.createElement('tr');
        row.innerHTML += `
          <td>${procedure.name}</dt>
          <td>
          

            <button class="button download-file" id="download-file" data-entityId="${procedure.name}%${procedure.file}">
            <i class="fa-solid fa-download"></i>
            </button>
          </dt>
          
          <td class="entity_options">
          
            <button class="button" id="remove-entity" data-entityId="${procedure.id}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </dt>
        `;
        table.appendChild(row);
      }
    }
    this.register();
    this.remove();
    this.download();
    //FUNCION PARA DESCARGAR EL ARCHIVO


  }
  download() {
    const download = document.querySelectorAll('#download-file');
    download.forEach((downfile) => {

      const entityId = downfile.dataset.entityid;
      const splitEntity = entityId.split('%');
      console.log(splitEntity)
      const nameFile = splitEntity[0];
      const entityIdFile = splitEntity[1];

      downfile.addEventListener('click', async () => {
        const file = await getFile(entityIdFile)

        var link = document.createElement('a');
        link.href = file
        link.target = '_blank'; // Añade esta línea para forzar la descarga
        link.type = 'application/octet-stream'; // Añade
        link.download = `${nameFile}.pdf`; // Puedes cambiar el nombre del archivo si lo deseas
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link)

      });
    });


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
        new Procedures().render(infoPage.offset, currentPage, infoPage.search);
      });
      return button;
    }
    function pagesOptions(items, currentPage) {
      paginationWrapper.innerHTML = '';
      let pages = pageNumbers(pageCount, Config.maxLimitPage, currentPage);
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
        new Procedures().render(Config.offset, Config.currentPage, infoPage.search);
      });
      nextButton.addEventListener('click', () => {
        infoPage.offset = Config.tableRows * (pageCount - 1);
        new Procedures().render(infoPage.offset, pageCount, infoPage.search);
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
              <div class="avatar"><i class="fa-solid fa-building"></i></div>
              <h1 class="entity_editor_title">Registrar <br><small>Procedimiento</small></h1>
            </div>

            <button class="btn btn_close_editor" id="close"><i class="fa-regular fa-x"></i></button>
          </div>

          <!-- EDITOR BODY -->
          <div class="entity_editor_body">
            <div class="material_input">
              <input type="text" id="entity-name" autocomplete="none" required>
              <label for="entity-name">Procedimiento</label>
            </div>
            
            <div class="sidebar_section">
                <input type="file" id="file-handler"  accept="application/pdf" required>
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
      const _fileHandler = document.getElementById('file-handler');
      const registerButton = document.getElementById('register-entity');
      let fileProcedure;
      _fileHandler.addEventListener('change', async () => {


        let size = _fileHandler.files[0].size;
        let sizekiloBytes = size / 1024;
        let sizeMegaBytes = sizekiloBytes / 1024;
        if (sizeMegaBytes > 2) {
          alert(`Archivo no debe exceder los 2 Mb`);
          _fileHandler.value = '';
        } else if(/\s/.test(_fileHandler.files[0].name)){
          alert(`Nombre de archivo no debe contener espacios en blanco`);
          _fileHandler.value = '';
        }else {
          let file = await setFile(_fileHandler.files[0]);
          let body = JSON.stringify(file);
          let parse = JSON.parse(body);
          fileProcedure = parse.fileRef;

        }

      });


      registerButton.addEventListener('click', async (e) => {
        e.preventDefault();
        if(!infoPage.actions.includes("INS") && !Config.currentUser?.isMaster){
          alert("Usuario no tiene permiso de registrar.");
        }else{
          const name = document.getElementById('entity-name')
          //let _userInfo = await getUserInfo();
          const customerId = localStorage.getItem('customer_id');
          const inputsCollection = {
            name: document.getElementById('entity-name'),
          };
          const raw = JSON.stringify({
            "name": `${inputsCollection.name.value}`,
            "file": fileProcedure,
            "user": {
              "id": `${Config.currentUser.id}` //`${_userInfo['attributes']['id']}`
            },
            "customer": {
              "id": `${customerId}`
            }

          });
          if (name.value.trim() === '' || name.value.trim() === null) {
            alert('Nombre del procedimiento vacío')
          }
          else if (fileProcedure == '' || fileProcedure === null || fileProcedure === undefined) {
            alert('Archivo del procedimiento vacío')
          }
          else {
            reg(raw);
          }
        }
      });


      const reg = async (raw) => {
        registerEntity(raw, 'Procedure_')
          .then((res) => {
            setTimeout(async () => {
              //let data = await getUsers();
              const tableBody = document.getElementById('datatable-body');
              const container = document.getElementById('entity-editor-container');
              new CloseDialog().x(container);
              new Procedures().render(Config.offset, Config.currentPage, infoPage.search);
            }, 1000);
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
                          <h2>¿Deseas eliminar este Procedimiento?</h2>
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
          const deleteButton = document.getElementById('delete');
          const cancelButton = document.getElementById('cancel');
          const dialogContent = document.getElementById('dialog-content');
          deleteButton.onclick = async () => {
            deleteEntity('Procedure_', entityId)
              .then((res) => {
                setTimeout(async () => {
                  //let data = await getUsers();
                  const tableBody = document.getElementById('datatable-body');
                  new CloseDialog().x(dialogContent);
                  new Procedures().render(infoPage.offset, infoPage.currentPage, infoPage.search);
                }, 1000);
              });
          };
          cancelButton.onclick = () => {
            new CloseDialog().x(dialogContent);
            //this.render();
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
export const setNewPassword = async () => {
  const users = await getEntitiesData('User');
  const FNewUsers = users.filter((data) => data.isSuper === false);
  FNewUsers.forEach((newUser) => {
  });
  console.group('Nuevos usuarios');
  console.log(FNewUsers);
  console.time(FNewUsers);
  console.groupEnd();
};
