// @filename: Layout.ts
export const tableLayout = `
  <div class="datatable" id="datatable">
    <div class="datatable_header">
      <div class="datatable_title" id="datatable-title"><h1>Superusuarios</h1></div>
      <div class="datatable_tools" id="datatable-tools">
        <input type="search"
        class="search_input"
        placeholder="Buscar"
        id="search">
        <button
            class="datatable_button add_user"
            id="btnSearch">
            <i class="fa-solid fa-search"></i>
        </button>
        <button
          class="datatable_button add_user"
          id="new-entity">
          <i class="fa-solid fa-user-plus"></i>
        </button>

        <button
          class="datatable_button import_user"
          id="import-entities" style="display: none">
          Importar
        </button>

        <button class="datatable_button import_user" id="export-entities">Exportar</button>
      </div>
    </div>

    <table class="datatable_content">
      <thead><tr>
        <th><span data-type="name">
          Nombre <i class="fa-regular fa-filter"></i>
        </span></th>

        <th colspan="2"><span data-type="id">
          ID <i class="fa-regular fa-filter"></i>
        </span></th>

        <th><span data-type="type">
          Tipo <i class="fa-regular fa-filter"></i>
        </span></th>

        <!-- th class="header_filled header_key"></!-->

        <th class="thead_centered"><span data-type="status">
          Estado <i class="fa-regular fa-filter"></i>
        </span></th>

        <th class="thead_centered"><span data-type="verified">
          Verif. <i class="fa-regular fa-filter"></i>
        </span></th>

        <th class="thead_centered"><span data-type="master">
          Master <i class="fa-regular fa-filter"></i>
        </span></th>

        <th class="header_filled"></th>

      </tr></thead>
      <tbody id="datatable-body" class="datatable_body">

      </tbody>
    </table>

    </div>

    <div class="datatable_footer">
      <div class="datatable_pagination" id="pagination-container"></div>
    </div>`;
    export const UIConvertToSU = `
    <div class="modal_container" id="modal_container">
  
        <div class="modal_window">
            <div class="modal_header">
                <div class="modal_title modal_title-info">
                    <div class="title">
                        <i class="fa-solid fa-add-user"></i>
                        <span class="title">Verificación</span>
                    </div>
  
                    <div class="counter">
                        <span id="stepsCounter">Paso <span id="stepCount">1</span> de 2</span>
                    </div>
                </div>
            </div>
  
            <div class="modal_body">
                <div id="modal-view-one" class="modal_view">
                    <p>¿Desea enviar un nuevo código a verificación a <span id="username"></span>?</p>
                    <br>
  
                    <form>
                        <div>
                            <label for="input-email">
                              Email <input type="email" id="input-email">
                            </label>
                        </div>
  
                        <div class="material_input" style="display: none">
                            <input type="password" id="input-password">
                            <label for="input-password">Contraseña</label>
                        </div>
                    </form>
                </div>
  
                <div id="modal-view-two" class="modal_view modal_view-isHidden">
                    <p>Se enviará un código de verificación al correo de <br> <b><span id="result-mail"></span></b></p>
                    <p style="display: none">Su código de verificación es:</p>
                    <b class="verification_code_result" style="display: none"><span id="confirmation-code"></span></b>
                </div>
            </div>
  
            <div class="modal_footer">
                <div class="modal_footer-align_right">
                    <div class="modal_button_group align_right">
                        <button class="btn btn_default" id="button-cancel">Cancelar</button>
                        <button class="btn btn_primary" id="button-next-userconverter">Enviar</button>
                    </div>
                    <div class="modal_button_group modal_button_group-isHidden align_right">
                        <button class="btn btn_default" id="button-back">Atrás</button>
                        <button class="btn btn_primary" id="button-subtmit">Enviar</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  `;