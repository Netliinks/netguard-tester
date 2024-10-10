// @filename: SuperUsers.ts
import { deleteEntity, getEntityData, registerEntity, setPassword, setUserRole, updateEntity, getUserInfo, sendMail, getFilterEntityData, getFilterEntityCount } from "../../../endpoints.js";
import { drawTagsIntoTables, inputObserver, inputSelect, inputSelectType, CloseDialog, filterDataByHeaderType, verifyUserType, getVerifyEmail, getVerifyUsername, pageNumbers, fillBtnPagination, getPermission, getPermissions } from "../../../tools.js";
import { Config } from "../../../Configs.js";
import { tableLayout, UIConvertToSU } from "./Layout.js";
import { tableLayoutTemplate } from "./Templates.js";
import { exportSuperCsv, exportSuperPdf, exportSuperXls } from "../../../exportFiles/superUsers.js";
import { UserPermissions } from "./permissions/Permissions.js";
const tableRows = Config.tableRows;
const currentPage = Config.currentPage;
const SUser = true;
let currentUserInfo; 
let currentCustomer;
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
const currentUserData = async() => {
  //const currentUser = await getUserInfo();
  //const user = await getEntityData('User', `${currentUser.attributes.id}`);
  currentUserInfo = Config.currentUser;
  return Config.currentUser;
}
const currentCustomerData = async() => {
  const customer = await getEntityData('Customer', `${customerId}`);
  return customer;
}
const getUsers = async (superUser) => {
    const currentUser = await currentUserData(); //usuario logueado
    const response = async () => {
      currentCustomer = await currentCustomerData();
      /*const users = await getEntitiesData('User');
      const FSuper = users.filter((data) => data.isSuper === superUser);
      const admin = FSuper.filter((data) => data.username != `admin`);
      const consulta = admin.filter((data) => data.username != `consulta`);
      const FCustomer = consulta.filter((data) => `${data.customer?.id}` === `${customerId}`);*/
      let raw = JSON.stringify({
        "filter": {
            "conditions": [
                {
                    "property": "customer.id",
                    "operator": "=",
                    "value": `${customerId}`
                },
                {
                    "property": "isSuper",
                    "operator": "=",
                    "value": `${superUser}`
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
                              "property": "dni",
                              "operator": "contains",
                              "value": `${infoPage.search.toLowerCase()}`
                          },
                          {
                              "property": "firstName",
                              "operator": "contains",
                              "value": `${infoPage.search.toLowerCase()}`
                          },
                          {
                              "property": "lastName",
                              "operator": "contains",
                              "value": `${infoPage.search.toLowerCase()}`
                          },
                          {
                              "property": "secondLastName",
                              "operator": "contains",
                              "value": `${infoPage.search.toLowerCase()}`
                          },
                          {
                              "property": "username",
                              "operator": "contains",
                              "value": `${infoPage.search.toLowerCase()}`
                          },
                          {
                              "property": "email",
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
                      "property": "isSuper",
                      "operator": "=",
                      "value": `${superUser}`
                  }
              ]
          },
          sort: "-createdDate",
          limit: Config.tableRows,
          offset: infoPage.offset,
          fetchPlan: 'full',
      });
    }
    infoPage.count = await getFilterEntityCount("User", raw);
    dataPage = await getFilterEntityData("User", raw);
    return dataPage;
  }
  if(currentUser?.isMaster){
    return response();
  }else{
      const permission = await getPermission('USER_ADMIN', currentUser.id);
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
export class SuperUsers {
    constructor() {
        this.dialogContainer = document.getElementById('app-dialogs');
        this.entityDialogContainer = document.getElementById('entity-editor-container');
        this.content = document.getElementById('datatable-container');
        this.searchEntity = async (tableBody /*, data: any*/) => {
            const search = document.getElementById('search');
            const btnSearch = document.getElementById('btnSearch');
            search.value = infoPage.search;
            await search.addEventListener('keyup', () => {
                /*const arrayData = data.filter((user) => `${user.firstName}
                 ${user.lastName}
                 ${user.username}`
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
              new SuperUsers().render(Config.offset, Config.currentPage, search.value.toLowerCase().trim());
            });
        };
        this.generateUserName = async () => {
            const firstName = document.getElementById('entity-firstname');
            const secondName = document.getElementById('');
            const lastName = document.getElementById('entity-lastname');
            const secondLastName = document.getElementById('entity-secondlastname');
            const clientName = document.getElementById('entity-customer');
            const userName = document.getElementById('entity-username');
            let UserNameFFragment = '';
            let UserNameLNFragment = '';
            let UserNameSLNFragment = '';
            firstName.addEventListener('keyup', (e) => {
                UserNameFFragment = firstName.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                userName.setAttribute('value', `${UserNameFFragment.trim()}.${UserNameLNFragment}${UserNameSLNFragment[0] ?? ''}`);
            });
            lastName.addEventListener('keyup', (e) => {
                UserNameLNFragment = lastName.value.toLowerCase();
                userName.setAttribute('value', `${UserNameFFragment.trim()}.${UserNameLNFragment}${UserNameSLNFragment[0] ?? ''}`);
            });
            secondLastName.addEventListener('keyup', (e) => {
                UserNameSLNFragment = secondLastName.value.toLowerCase();
                if (secondLastName.value.length > 0) {
                //    UserNameFFragment[0];
                    userName.setAttribute('value', `${UserNameFFragment}.${UserNameLNFragment}${UserNameSLNFragment[0]}`);
                }
                else {
                    userName.setAttribute('value', `${UserNameFFragment}.${UserNameLNFragment}`);
                }
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
        let data = await getUsers(SUser);
        tableBody.innerHTML = tableLayoutTemplate.repeat(tableRows);
        this.load(tableBody, currentPage, data);
        this.searchEntity(tableBody  /*, data*/);
        new filterDataByHeaderType().filter();
        this.pagination(data, tableRows, infoPage.currentPage);
    }
    load(table, currentPage, data) {
        setUserPassword(SUser);
        //setRole(SUser);
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
        <td></td>
      `;
            table.appendChild(row);
        }
        else {
            for (let i = 0; i < paginatedItems.length; i++) {
                let client = paginatedItems[i];
                let row = document.createElement('tr');
                row.innerHTML += `
          <td>${client.firstName} ${client.lastName}</td>
          <td>${client.username}</td>
          <td class="key"><button class="button" data-userid="${client.id}" id="change-user-password"><i class="fa-regular fa-key"></i></button></td>
          <td>${verifyUserType(client.userType)}</td>
          <td class="tag"><span>${client.state.name}</span></td>
          <td>${client.verifiedSuper ? 'Si' : 'No'}</td>
          <td>${client.isMaster ? 'Si' : 'No'}</td>

          <td class="entity_options">
            <button class="button" id="permission-entity" data-entityId="${client.id}">
                <i class="fa-solid fa-sliders-up"></i>
            </button>

            <button class="button" id="convert-entity" data-entityId="${client.id}">
                <i class="fa-solid fa-envelope"></i>
            </button>

            <button class="button" id="edit-entity" data-entityId="${client.id}">
              <i class="fa-solid fa-pen"></i>
            </button>

            <button class="button" id="remove-entity" data-entityId="${client.id}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </dt>
        `;
                table.appendChild(row);
                drawTagsIntoTables();
            }
        }
        this.register();
        this.import();
        this.export(SUser);
        this.edit(this.entityDialogContainer, data);
        this.remove();
        this.convertToSuper();
        this.changeUserPassword();
        this.setPermissions();
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
              <div class="avatar"><i class="fa-regular fa-user"></i></div>
              <h1 class="entity_editor_title">Registrar <br><small>Superusuarios</small></h1>
            </div>

            <button class="btn btn_close_editor" id="close"><i class="fa-regular fa-x"></i></button>
          </div>

          <!-- EDITOR BODY -->
          <div class="entity_editor_body">
            <div class="material_input">
              <input type="text" id="entity-firstname" autocomplete="none">
              <label for="entity-firstname"><i class="fa-solid fa-user"></i> Nombre</label>
            </div>

            <div class="material_input">
              <input type="text" id="entity-lastname" autocomplete="none">
              <label for="entity-lastname"><i class="fa-solid fa-user"></i> Apellido</label>
            </div>

            <div class="material_input">
              <input type="text" id="entity-secondlastname" autocomplete="none">
              <label for="entity-secondlastname"><i class="fa-solid fa-user"></i> 2do Apellido</label>
            </div>

            <div class="material_input">
              <input type="text"
                id="entity-phone"
                maxlength="10" autocomplete="none">
              <label for="entity-phone"><i class="fa-solid fa-phone"></i> Teléfono</label>
            </div>

            <div class="material_input">
              <input type="text"
                id="entity-dni"
                maxlength="10" autocomplete="none">
              <label for="entity-dni"><i class="fa-solid fa-id-card"></i> DNI</label>
            </div>

            <div class="material_input">
              <input type="email"
                id="entity-email"
                autocomplete="none">
              <label for="entity-email">Email</label>
            </div>

            <div class="material_input">
              <input type="text" id="entity-username" class="input_filled" placeholder="john.doe@ejemplo.com" readonly>
              <label for="entity-username"><i class="input_locked fa-solid fa-lock"></i> Nombre de usuario</label>
            </div>

            <div class="material_input_select">
              <label for="entity-type">Tipo</label>
              <input type="text" id="entity-type" class="input_select" readonly placeholder="cargando..." autocomplete="none">
              <div id="input-options" class="input_options">
              </div>
            </div>

            <div class="material_input_select">
              <label for="entity-state">Estado</label>
              <input type="text" id="entity-state" class="input_select" readonly placeholder="cargando..." autocomplete="none">
              <div id="input-options" class="input_options">
              </div>
            </div>

            <div class="input_checkbox">
                <label><input type="checkbox" class="checkbox" id="allow-master"> Todos los permisos</label>
            </div>

            <!--
            <div class="material_input_select">
              <label for="entity-business">Empresa</label>
              <input type="text" id="entity-business" class="input_select" readonly placeholder="cargando..." autocomplete="none">
              <div id="input-options" class="input_options">
              </div>
            </div>

            <div class="material_input_select">
              <label for="entity-citadel">Ciudadela</label>
              <input type="text" id="entity-citadel" class="input_select" readonly placeholder="cargando...">
              <div id="input-options" class="input_options">
              </div>
            </div>

            <div class="material_input_select">
              <label for="entity-customer">Cliente</label>
              <input type="text" id="entity-customer" class="input_select" readonly placeholder="cargando...">
              <div id="input-options" class="input_options">
              </div>
            </div>

            <div class="material_input_select" style="display: none">
              <label for="entity-department">Departamento</label>
              <input type="text" id="entity-department" class="input_select" readonly placeholder="cargando...">
              <div id="input-options" class="input_options">
              </div>
            </div>
            -->

            <br><br>
            <div class="material_input">
              <input type="password" id="tempPass" autocomplete="false">
              <label for="tempPass">Contraseña</label>
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
            inputSelectType('entity-type');
            //inputSelect('Citadel', 'entity-citadel');
            //inputSelect('Customer', 'entity-customer');
            inputSelect('State', 'entity-state');
            //inputSelect('Department', 'entity-department');
            //inputSelect('Business', 'entity-business');
            this.close();
            this.generateUserName();
            const registerButton = document.getElementById('register-entity');
            registerButton.addEventListener('click', async() => {
              if(!infoPage.actions.includes("INS") && !Config.currentUser?.isMaster){
                alert("Usuario no tiene permiso de registrar.");
              }else{
                const inputsCollection = {
                    firstName: document.getElementById('entity-firstname'),
                    lastName: document.getElementById('entity-lastname'),
                    secondLastName: document.getElementById('entity-secondlastname'),
                    phoneNumer: document.getElementById('entity-phone'),
                    state: document.getElementById('entity-state'),
                    //customer: document.getElementById('entity-customer'),
                    username: document.getElementById('entity-username'),
                   // citadel: document.getElementById('entity-citadel'),
                    temporalPass: document.getElementById('tempPass'),
                    userType: document.getElementById('entity-type'),
                    dni: document.getElementById('entity-dni'),
                    email: document.getElementById('entity-email'),
                    isMaster: document.getElementById('allow-master')
                };
                const randomKey = { key: Math.floor(Math.random() * 999999) };
                const raw = JSON.stringify({
                    "lastName": `${inputsCollection.lastName.value}`,
                    "secondLastName": `${inputsCollection.secondLastName.value}`,
                    "isSuper": true,
                    "newUser": true,
                    "hashSuper": randomKey.key,
                    "verifiedSuper": false,
                    "dni": `${inputsCollection.dni.value}`,
                    "email": `${inputsCollection.email.value}`,
                    "temp": `${inputsCollection.temporalPass.value}`,
                    "isMaster": `${inputsCollection.isMaster.checked ? true : false}`,
                    "isWebUser": false,
                    "active": true,
                    "firstName": `${inputsCollection.firstName.value}`,
                    "state": {
                        "id": `${inputsCollection.state.dataset.optionid}`
                    },
                    "contractor": {
                        "id": `${currentUserInfo.contractor.id}`,
                    },
                    "customer": {
                        "id": `${customerId}`
                    },
                    "citadel": {
                        "id": `${currentUserInfo.citadel.id}`
                    },
                    "business":{
                        "id": `${currentUserInfo.business.id}`
                    },
                    "department":{
                      "id": `${currentUserInfo.department.id}`
                    },
                    "phone": `${inputsCollection.phoneNumer.value}`,
                    "userType": `${inputsCollection.userType.dataset.optionid}`,
                    "username": `${inputsCollection.username.value}@${currentCustomer.name.toLowerCase().replace(/\s+/g, '')}.com`
                });
                let userType = inputsCollection.userType.dataset.optionid;
                  if(userType == 'CUSTOMER'){
                    userType = 'Netvisitors';
                  }else if(userType == 'GUARD'){
                    userType = 'Netguard';
                  }
                  let mailRaw = JSON.stringify({
                    "address": inputsCollection.email.value,
                    "subject": "Netliinks - Clave de validación.",
                    "body": `Estimado ${inputsCollection.firstName.value}, el código de confirmación para ingresar a la plataforma de ${userType} es: \n
                                                               ${randomKey.key}\nNo responder a este correo.\nSaludos.\n\n\nNetliinks S.A.`
                  });
                const existEmail = await getVerifyEmail(inputsCollection.email.value);
                const existUsername = await getVerifyUsername(`${inputsCollection.username.value}@${currentCustomer.name.toLowerCase().replace(/\s+/g, '')}.com`);
                if (existUsername != "none") {
                    alert("¡Usuario ya existe, es tipo " + existUsername + "!");
                }else if(existEmail == true){
                    alert("¡Correo electrónico ya existe!");
                }else if (inputsCollection.firstName.value === '' || inputsCollection.firstName.value === undefined) {
                  alert("¡Nombre vacío!");
                }
                else if (inputsCollection.lastName.value === '' || inputsCollection.lastName.value === undefined) {
                    alert("¡Primer apellido vacío!");
                }
                else if (inputsCollection.secondLastName.value === '' || inputsCollection.secondLastName.value === undefined) {
                    alert("¡Segundo apellido vacío!");
                }
                else if (inputsCollection.email.value === '' || inputsCollection.email.value === undefined) {
                    alert("¡Correo vacío!");
                }
                else if (inputsCollection.dni.value === '' || inputsCollection.dni.value === undefined) {
                    alert("DNI vacío!");
                }
                else if (inputsCollection.temporalPass.value === '' || inputsCollection.temporalPass.value === undefined) {
                    alert("Clave vacío!");
                }else{
                    reg(raw, mailRaw);
                }       
              }
            });
        };
        const reg = async (raw, mailRaw) => {
            registerEntity(raw, 'User')
                .then(res => {
                sendMail(mailRaw);
                setTimeout(async () => {
                  //let data = await getUsers(SUser);
                    const tableBody = document.getElementById('datatable-body');
                    const container = document.getElementById('entity-editor-container');
                    new CloseDialog().x(container);
                    new SuperUsers().render(Config.offset, Config.currentPage, infoPage.search);
                }, 1000);
                //setNewPassword();
            });
            /*const setNewPassword = async () => {
                const users = await getEntitiesData('User');
                const FNewUsers = users.filter((data) => data.isSuper === true);
                FNewUsers.forEach((newUser) => {
                });
            };*/
        };
    }
    import() {
        const importButton = document.getElementById('import-entities');
        importButton.addEventListener('click', () => {
            console.log('Importing...');
        });
    }
    edit(container, data) {
        // Edit entity
        const edit = document.querySelectorAll('#edit-entity');
        edit.forEach((edit) => {
            const entityId = edit.dataset.entityid;
            edit.addEventListener('click', () => {
                RInterface('User', entityId);
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
              <h1 class="entity_editor_title">Editar <br><small>${data.firstName} ${data.lastName}</small></h1>
            </div>

            <button class="btn btn_close_editor" id="close"><i class="fa-solid fa-x"></i></button>
          </div>

          <!-- EDITOR BODY -->
          <div class="entity_editor_body">
            <div class="material_input">
              <input type="text" id="entity-firstname" class="input_filled" value="${data.firstName}" readonly>
              <label for="entity-firstname">Nombre</label>
            </div>

            <div class="material_input">
              <input type="text" id="entity-lastname" class="input_filled" value="${data.lastName}" readonly>
              <label for="entity-lastname">Apellido</label>
            </div>

            <div class="material_input">
              <input type="text" id="entity-secondlastname" class="input_filled" value="${data.secondLastName}" readonly>
              <label for="entity-secondlastname">2do Apellido</label>
            </div>

            <div class="material_input">
              <input type="text"
                id="entity-phone"
                class="input_filled"
                maxlength="10"
                value="${data?.phone ?? ''}">
              <label for="entity-phone">Teléfono</label>
            </div>

            <div class="material_input_select">
              <label for="entity-state">Estado</label>
              <input type="text" id="entity-state" class="input_select" readonly placeholder="cargando...">
              <div id="input-options" class="input_options">
              </div>
            </div>

            <div class="material_input">
              <input type="text" id="entity-username" class="input_filled" value="${data.username}" readonly>
              <label for="entity-username">Nombre de usuario</label>
            </div>

            <div class="material_input">
              <input type="text" id="entity-type" class="input_filled" value="${verifyUserType(data.userType)}" readonly>
              <label for="entity-type">Tipo</label>
            </div>

            <div class="material_input">
              <input type="text" maxlength="10" id="entity-dni" class="input_filled" value="${data?.dni ?? ''}">
              <label for="entity-dni">Cédula</label>
            </div>

            <div class="material_input">
              <input type="email" id="entity-email" class="input_filled" value="${data?.email ?? ''}" disabled>
              <label for="entity-email">Email</label>
            </div>

            <!--
            <div class="material_input_select">
              <label for="entity-business">Empresa</label>
              <input type="text" id="entity-business" class="input_select" readonly placeholder="cargando...">
              <div id="input-options" class="input_options">
              </div>
            </div>

            <div class="material_input_select">
              <label for="entity-citadel">Ciudadela</label>
              <input type="text" id="entity-citadel" class="input_select" readonly placeholder="cargando...">
              <div id="input-options" class="input_options">
              </div>
            </div>
            -->

            <div class="material_input">
              <input type="text" id="entity-customer" class="input_filled" value="${data.customer.name}" readonly>
              <label for="entity-customer">Empresa</label>
            </div>

            <div class="input_checkbox">
              <label><input type="checkbox" class="checkbox" id="allow-master"> Todos los permisos</label>
            </div>

            <!--
            <div class="material_input_select" style="display: none">
              <label for="entity-department">Departamento</label>
              <input type="text" id="entity-department" class="input_select" readonly placeholder="cargando...">
              <div id="input-options" class="input_options">
              </div>
            </div>
            
            <br><br><br>
            <div class="material_input" style="display: none">
              <input type="password" id="tempPass" >
              <label for="tempPass">Clave</label>
            </div> -->
            <br>
            <div style="display:flex;justify-content:center">
                <img alt="Código QR ${data?.dni ?? ''}" id="qrcode">
                <br>
                <button id="btnDescargar">Descargar</button>
            </div>

          </div>
          <!-- END EDITOR BODY -->

          <div class="entity_editor_footer">
            <button class="btn btn_primary btn_widder" id="update-changes">Guardar</button>
          </div>
        </div>
      `;
            const checkbox = document.getElementById('allow-master');
            if (data?.isMaster === true) {
                checkbox?.setAttribute('checked', 'true');
            }
            inputObserver();
            //inputSelectType('entity-type',data.userType);
            //inputSelect('Citadel', 'entity-citadel');
            //inputSelect('Customer', 'entity-customer');
            inputSelect('State', 'entity-state', data.state.name);
            //inputSelect('Department', 'entity-department');
            //inputSelect('Business', 'entity-business');
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
            this.close();
            UUpdate(entityID);
        };
        const download = (qr, data) => {
          const btnDescargar = document.getElementById('btnDescargar');
          btnDescargar.addEventListener('click', () => {
              const enlace = document.createElement("a");
              enlace.href = qr.src;
              enlace.download = `Código QR ${data?.dni ?? ''}.png`;
              enlace.click();
          });
        };
        const UUpdate = async (entityId) => {
            const updateButton = document.getElementById('update-changes');
            updateButton.addEventListener('click', async() => {
              const $value = {
                // @ts-ignore
                //firstName: document.getElementById('entity-firstname'),
                // @ts-ignore
                //lastName: document.getElementById('entity-lastname'),
                // @ts-ignore
                //secondLastName: document.getElementById('entity-secondlastname'),
                // @ts-ignore
                phone: document.getElementById('entity-phone'),
                // @ts-ignore
                //email: document.getElementById('entity-email'),
                // @ts-ignore
                status: document.getElementById('entity-state'),
                // @ts-ignore
                dni: document.getElementById('entity-dni'),
                isMaster: document.getElementById('allow-master'),
                // @ts-ignore
                //business: document.getElementById('entity-business'),
                // @ts-ignore
                //citadel: document.getElementById('entity-citadel'),
                // @ts-ignore
                //department: document.getElementById('entity-department'),
                // @ts-ignore
                //customer: document.getElementById('entity-customer'),
                //// @ts-ignore
                //userType: document.getElementById('entity-type')
            };
              let raw = JSON.stringify({
                  // @ts-ignore
                  //"lastName": `${$value.lastName?.value}`,
                  // @ts-ignore
                  //"secondLastName": `${$value.secondLastName?.value}`,
                  "active": true,
                  // @ts-ignore
                  //"firstName": `${$value.firstName?.value}`,
                  "state": {
                      "id": `${$value.status?.dataset.optionid}`
                  },
                  //"customer": {
                  //    "id": `${$value.customer?.dataset.optionid}`
                  //},
                  // @ts-ignore
                  "phone": `${$value.phone?.value}`,
                  "dni": `${$value.dni.value}`,
                  "isMaster": `${$value.isMaster.checked ? true : false}`,
                  // @ts-ignore
                  //"email": `${$value.email?.value}`,
                  // @ts-ignore
                  //"userType": `${$value.userType?.dataset.optionid}`,
              });
              /*const existEmail = await getVerifyEmail($value.email?.value);
              if(existEmail == true){
                  alert("¡Correo electrónico ya existe!");
              }else{
                  update(raw);
              } */
              if(!infoPage.actions.includes("UPD") && !Config.currentUser?.isMaster){
                alert("Usuario no tiene permiso de actualizar.");
              }else if ($value.dni.value === '' || $value.dni.value === undefined) {
                alert("DNI vacío!");
              }else{
                update(raw);
              }
            });
            const update = (raw) => {
              updateEntity('User', entityId, raw)
                  .then((res) => {
                  setTimeout(async () => {
                      let tableBody;
                      let container;
                      let data;
                      //data = await getUsers(SUser);
                      new CloseDialog()
                          .x(container =
                          document.getElementById('entity-editor-container'));
                      new SuperUsers().render(infoPage.offset, infoPage.currentPage, infoPage.search);
                  }, 100);
              });
          };
        };
    }
    changeUserPassword() {
      const changeUserPasswordKeys = document.querySelectorAll('#change-user-password');
      changeUserPasswordKeys.forEach((buttonKey) => {
          buttonKey.addEventListener('click', async () => {
            if(!infoPage.actions.includes("UPD") && !Config.currentUser?.isMaster){
              alert("Usuario no tiene permiso de actualizar.");
            }else{
              let userId = buttonKey.dataset.userid;
              this.dialogContainer.style.display = 'block';
              this.dialogContainer.innerHTML = `
                  <div class="dialog_content" id="dialog-content">
                      <div class="dialog">
                          <div class="dialog_container padding_8">
                              <div class="dialog_header">
                                  <h2>Actualizar contraseña</h2>
                              </div>

                              <div class="dialog_message padding_8">
                                  <div class="material_input">
                                      <input type="password" id="password" autocomplete="none">
                                      <label for="entity-lastname"><i class="fa-solid fa-lock"></i> Nueva contraseña</label>
                                  </div>

                                  <div class="material_input">
                                      <input type="password" id="re-password" autocomplete="none">
                                      <label for="entity-lastname"><i class="fa-solid fa-lock"></i> Repetir contraseña</label>
                                  </div>
                              </div>

                              <div class="dialog_footer">
                                  <button class="btn btn_primary" id="cancel">Cancelar</button>
                                  <button class="btn btn_danger" id="update-password">Actualizar</button>
                              </div>
                          </div>
                      </div>
                  </div>
              `;
              inputObserver();
              const _password = document.getElementById('password');
              const _repassword = document.getElementById('re-password');
              const _updatePasswordButton = document.getElementById('update-password');
              const _closeButton = document.getElementById('cancel');
              const _dialog = document.getElementById('dialog-content');
              _updatePasswordButton.addEventListener('click', () => {
                  if(!infoPage.actions.includes("UPD") && !Config.currentUser?.isMaster){
                      alert("Usuario no tiene permiso de actualizar.");
                  }else if (_password.value === '') {
                      alert('El campo "Contraseña" no puede estar vacío.');
                  }
                  else if (_repassword.value === ' ') {
                      alert('Debe repetir la contraseña para continuar');
                  }
                  else if (_password.value === _repassword.value) {
                      let raw = JSON.stringify({
                          "id": `${userId}`,
                          "newPassword": `${_password.value}`
                      });
                      setPassword(raw)
                          .then(() => {
                          setTimeout(() => {
                              alert('Se ha cambiado la contraseña');
                              new CloseDialog().x(_dialog);
                          }, 1000);
                      });
                  }
                  else {
                      console.log('Las contraseñas no coinciden');
                      alert('Las contraseñas no coinciden');
                  }
              });
              _closeButton.onclick = () => {
                  new CloseDialog().x(_dialog);
              };
            }
          });
      });
    }
    remove() {
        const remove = document.querySelectorAll('#remove-entity');
        remove.forEach((remove) => {
            const entityId = remove.dataset.entityid;
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
                  <h2>¿Deseas eliminar este supersuario?</h2>
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
                deleteButton.onclick = async() => {
                  if(!infoPage.actions.includes("DLT") && !Config.currentUser?.isMaster){
                    alert("Usuario no tiene permiso de eliminar.");
                  }else{
                    deleteEntity('User', entityId)
                    .then((res) => {
                      setTimeout(async () => {
                        //let data = await getUsers(SUser);
                          const tableBody = document.getElementById('datatable-body');
                          new CloseDialog().x(dialogContent);
                          new SuperUsers().render(infoPage.offset, infoPage.currentPage, infoPage.search);
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
    setPermissions() {
      const setPermission = document.querySelectorAll('#permission-entity');
      setPermission.forEach((buttonKey) => {
            buttonKey.addEventListener('click', async () => {
                let entityId = buttonKey.dataset.entityid;
                new UserPermissions().render(Config.offset, Config.currentPage, "", entityId, infoPage.actions);
            });
        });
  }
    close() {
        const closeButton = document.getElementById('close');
        const editor = document.getElementById('entity-editor-container');
        closeButton.addEventListener('click', () => {
            new CloseDialog().x(editor);
        }, false);
    }
    export = (SUser) => {
      const exportUsers = document.getElementById('export-entities');
      exportUsers.addEventListener('click', async () => {
        if(!infoPage.actions.includes("DWN") && !Config.currentUser?.isMaster){
          alert("Usuario no tiene permiso de exportar.");
        }else{
          this.dialogContainer.style.display = 'block';
          this.dialogContainer.innerHTML = `
          <div class="dialog_content" id="dialog-content">
              <div class="dialog">
                  <div class="dialog_container padding_8">
                      <div class="dialog_header">
                          <h2>Seleccione un tipo</h2>
                      </div>

                      <div class="dialog_message padding_8">
                          <div class="form_group">
                              <label for="exportCsv">
                                  <input type="radio" id="exportCsv" name="exportOption" value="csv" /> CSV
                              </label>

                              <label for="exportXls">
                                  <input type="radio" id="exportXls" name="exportOption" value="xls" checked /> XLS
                              </label>

                              <label for="exportPdf">
                                  <input type="radio" id="exportPdf" name="exportOption" value="pdf" /> PDF
                              </label>
                          </div>
                      </div>

                      <div class="dialog_footer">
                          <button class="btn btn_primary" id="cancel">Cancelar</button>
                          <button class="btn btn_danger" id="export-data">Exportar</button>
                      </div>
                  </div>
              </div>
          </div>
      `;
          inputObserver();
          const _closeButton = document.getElementById('cancel');
          const exportButton = document.getElementById('export-data');
          const _dialog = document.getElementById('dialog-content');
          exportButton.addEventListener('click', async () => {
            if(!infoPage.actions.includes("DWN") && !Config.currentUser?.isMaster){
              alert("Usuario no tiene permiso de exportar.");
            }else{
              const _values = {
                  exportOption: document.getElementsByName('exportOption')
              };
              let rawExport = JSON.stringify({
                "filter": {
                    "conditions": [
                        {
                            "property": "customer.id",
                            "operator": "=",
                            "value": `${customerId}`
                        },
                        {
                            "property": "isSuper",
                            "operator": "=",
                            "value": `${SUser}`
                        }
                    ],
                },
                sort: "-createdDate",
                fetchPlan: 'full',
              });
              const users = await getFilterEntityData("User", rawExport); //await getUsers(SUser)
              for (let i = 0; i < _values.exportOption.length; i++) {
                  let ele = _values.exportOption[i];
                  if (ele.type = "radio") {
                      if (ele.checked) {
                          if (ele.value == "xls") {
                              // @ts-ignore
                              exportSuperXls(users);
                          }
                          else if (ele.value == "csv") {
                              // @ts-ignore
                              exportSuperCsv(users);
                          }
                          else if (ele.value == "pdf") {
                              // @ts-ignore
                              exportSuperPdf(users);
                          }
                      }
                  }
              }
            }
          });
          _closeButton.onclick = () => {
              new CloseDialog().x(_dialog);
          };
        }
      });
    };
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
                new SuperUsers().render(infoPage.offset, currentPage, infoPage.search);
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
                new SuperUsers().render(Config.offset, Config.currentPage, infoPage.search);
            });
            nextButton.addEventListener('click', () => {
                infoPage.offset = Config.tableRows * (pageCount - 1);
                new SuperUsers().render(infoPage.offset, pageCount, infoPage.search);
            });
        }
  }
  convertToSuper() {
    const convert = document.querySelectorAll('#convert-entity');
    convert.forEach((convert) => {
        const entityId = convert.dataset.entityid;
        convert.addEventListener('click', async () => {
          if(!infoPage.actions.includes("UPD") && !Config.currentUser?.isMaster){
            alert("Usuario no tiene permiso de actualizar.");
          }else{
            const user = await getEntityData('User', entityId);
            if (!user.verifiedSuper) {
                this.dialogContainer.style.display = 'block';
                this.dialogContainer.innerHTML = UIConvertToSU;
                const modalUsername = document.getElementById('username');
                modalUsername.innerHTML = user.firstName;
                inputObserver();
                // modal functionality
                const nextButton = document.getElementById('button-next-userconverter');
                const cancelButton = document.getElementById('button-cancel');
                const buttonBack = document.getElementById('button-back');
                const buttonSubmit = document.getElementById('button-submit');
                const modalViews = document.querySelectorAll('.modal_view');
                const buttonGroups = document.querySelectorAll('.modal_button_group');
                const stepCount = document.getElementById('stepCount');
                const resultMail = document.getElementById('result-mail');
                const inputMail = document.getElementById('input-email');
                const confirmationCode = document.getElementById('confirmation-code');
                const modalContainer = document.getElementById('modal_container');
                let mailRaw = [];
                let updateRaw = [];
                //let roleRaw = [];
                inputMail.value = user.email;
                nextButton.addEventListener('click', async () => {
                  if(!infoPage.actions.includes("UPD") && !Config.currentUser?.isMaster){
                    alert("Usuario no tiene permiso de actualizar.");
                  }else{
                    const randomKey = { key: Math.floor(Math.random() * 999999) };
                    const existEmail = await getVerifyEmail(inputMail.value);
                    if (inputMail.value === '' || inputMail.value == null) {
                        alert('Debe ingresar un correo para continuar.');
                    }
                    else if (inputMail.value != user.email && existEmail == true) {
                        alert("¡Correo electrónico ya existe!");
                    }
                    else {
                        modalViews.forEach((modalView) => {
                            modalView.classList.toggle('modal_view-isHidden');
                            stepCount.innerText = '2';
                        });
                        buttonGroups.forEach((buttonGroup) => {
                            buttonGroup.classList.toggle('modal_button_group-isHidden');
                        });
                        resultMail.innerText = inputMail.value;
                        confirmationCode.innerText = randomKey.key;
                        //let roleCode;
                        let plataform
                        if(user.userType === 'GUARD'){
                          //roleCode = 'app_web_guardias'
                          plataform = 'Netguard'
                        }else if(user.userType === 'CUSTOMER'){
                          //roleCode = 'app_web_clientes'
                          plataform = 'Netvisitors'
                        }
                        
                        mailRaw = JSON.stringify({
                            "address": inputMail.value,
                            "subject": "Netliinks - Clave de validación.",
                            "body": `Estimado ${user.firstName}, el código de confirmación para ingresar a la plataforma de ${plataform} es: \n
                                                                        ${randomKey.key}\nNo responder a este correo.\nSaludos.\n\n\nNetliinks S.A.`
                        });
                        updateRaw = JSON.stringify({
                            "email": inputMail.value,
                            "hashSuper": randomKey.key,
                        });
                        
                        /*roleRaw = JSON.stringify({
                            "id": `${user.id}`,
                            "roleCode": `${roleCode}`
                        });*/
                        sendMail(mailRaw);
                        updateEntity('User', entityId, updateRaw);
                        //setUserRole(roleRaw);
                        setTimeout(async () => {
                            //let data = await getUsers(SUser);
                            const tableBody = document.getElementById('datatable-body');
                            new CloseDialog().x(modalContainer);
                            //new SuperUsers().render(infoPage.offset, infoPage.currentPage, infoPage.search);
                            //this.load(tableBody, currentPage, data);
                        }, 100);
                    }
                  }
                });
                cancelButton.onclick = () => {
                    new CloseDialog().x(modalContainer);
                };
            }
            else {
                alert(`Usuario ${user.username} ya está verificado.`);
            }
          }
        });
    });
  }
}

export const setNewPassword = async () => {
    const users = await getEntitiesData('User');
    const FNewUsers = users.filter((data) => data.isSuper === false);
    FNewUsers.forEach((newUser) => {
    });
};

export const setUserPassword = async (SUser) => {
  /*const users = await getEntitiesData('User');
  const filterBySuperUsers = users.filter((data) => data.isSuper === SUser);
  const FCustomer = filterBySuperUsers.filter((data) => `${data.customer.id}` === `${customerId}`);
  const data = FCustomer;*/
  let raw = JSON.stringify({
    "filter": {
        "conditions": [
            {
                "property": "isSuper",
                "operator": "=",
                "value": `${true}`
            },
            {
                "property": "customer.id",
                "operator": "=",
                "value": `${customerId}`
            },
            {
                "property": "newUser",
                "operator": "=",
                "value": `${true}`
            },
            {
                "property": "temp",
                "operator": "<>",
                "value": ``
            }
        ]
    }
  });
  let data = await getFilterEntityData("User", raw);
  data.forEach((newUser) => {
      let raw = JSON.stringify({
          "id": `${newUser.id}`,
          "newPassword": `${newUser.temp}`
      });
      if (newUser.newUser === true && (newUser.temp !== undefined || newUser.temp !== ''))
          setPassword(raw);
  });
  setRole(data);
};
export async function setRole(data) {
  /*const users = await getEntitiesData('User');
  const filterByNewUsers = users.filter((data) => data.newUser === SUser);
  const FCustomer = filterByNewUsers.filter((data) => `${data.customer.id}` === `${customerId}`);
  const data = FCustomer;*/
  /*let raw = JSON.stringify({
    "filter": {
        "conditions": [
            {
                "property": "isSuper",
                "operator": "=",
                "value": `${SUser}`
            },
            {
                "property": "newUser",
                "operator": "=",
                "value": `${SUser}`
            },
            {
                "property": "customer.id",
                "operator": "=",
                "value": `${customerId}`
            },
            {
                "property": "temp",
                "operator": "<>",
                "value": ``
            }
        ]
    }
  });
  let data = await getFilterEntityData("User", raw);*/
  data.forEach((newUser) => {
      let roleCode;
      if(newUser.userType === 'GUARD'){
        roleCode = 'app_web_guardias'
      }else if(newUser.userType === 'CUSTOMER'){
        roleCode = 'app_web_clientes'
      }
      let raw = JSON.stringify({
          "id": `${newUser.id}`,
          "roleCode": `${roleCode}`
      });
      let updateNewUser = JSON.stringify({
          "newUser": false,
          "temp": ''
      });
      if (newUser.newUser === true) {
          setUserRole(raw).then((res) => {
            setTimeout(() => {
                updateEntity('User', newUser.id, updateNewUser);
            }, 1000);
          });
      }
  });
}
