Para crear un módulo en Odoo que represente una tabla de proyectos con el diseño y las relaciones que mencionas, vamos a extender el módulo generado por scaffold siguiendo estos pasos:

### 1. Estructura del módulo
Ya que has creado el módulo con `scaffold`, asegúrate de que tu módulo tenga una estructura similar a esta (suponiendo que el módulo se llama `project_kanban`):

```
project_kanban/
├── __init__.py
├── __manifest__.py
├── models/
│   ├── __init__.py
│   └── project.py
└── views/
    └── project_kanban_views.xml
```

### 2. Editar el archivo de modelo `project.py`
Dentro de la carpeta `models`, crea el archivo `project.py` o modifica el archivo existente y añade el siguiente código para definir el modelo `Project`:

```python
# project_kanban/models/project.py
from odoo import models, fields, api

class Project(models.Model):
    _name = 'project.kanban'
    _description = 'Project Kanban'

    name = fields.Char(string='Nombre del Proyecto', required=True)
    start_date = fields.Date(string='Fecha de Inicio')
    end_date = fields.Date(string='Fecha de Finalización')
    responsible_id = fields.Many2one('hr.employee', string='Responsable', required=True)
    client_id = fields.Many2one('res.partner', string='Cliente', required=True)
```

### 3. Crear la vista Kanban
Dentro de la carpeta `views`, crea el archivo `project_kanban_views.xml` para definir la vista Kanban. Aquí utilizaremos la estructura de vista en formato tarjeta de Odoo:

```xml
<!-- project_kanban/views/project_kanban_views.xml -->
<odoo>
    <record id="view_project_kanban" model="ir.ui.view">
        <field name="name">project.kanban.kanban.view</field>
        <field name="model">project.kanban</field>
        <field name="arch" type="xml">
            <kanban>
                <field name="name"/>
                <field name="start_date"/>
                <field name="end_date"/>
                <field name="responsible_id"/>
                <field name="client_id"/>

                <templates>
                    <t t-name="kanban-box">
                        <div t-attf-class="oe_kanban_card oe_kanban_global_click">
                            <div class="oe_kanban_details">
                                <strong><field name="name"/></strong>
                                <div>Cliente: <field name="client_id"/></div>
                                <div>Responsable: <field name="responsible_id"/></div>
                                <div>Inicio: <field name="start_date"/></div>
                                <div>Fin: <field name="end_date"/></div>
                            </div>
                        </div>
                    </t>
                </templates>
            </kanban>
        </field>
    </record>

    <record id="project_kanban_action" model="ir.actions.act_window">
        <field name="name">Proyectos</field>
        <field name="res_model">project.kanban</field>
        <field name="view_mode">kanban,tree,form</field>
    </record>

    <menuitem id="project_kanban_menu" name="Proyectos" action="project_kanban_action"/>
</odoo>
```

### 4. Configurar el archivo de manifiesto `__manifest__.py`
Actualiza el archivo `__manifest__.py` para incluir los archivos y dependencias necesarias:

```python
# project_kanban/__manifest__.py
{
    'name': 'Project Kanban',
    'version': '1.0',
    'category': 'Project',
    'summary': 'Gestión de proyectos en vista Kanban',
    'depends': ['base', 'hr', 'contacts'],
    'data': [
        'views/project_kanban_views.xml',
    ],
    'installable': True,
    'application': True,
}
```

### 5. Pasos finales para probar el módulo

1. **Añadir el módulo a Odoo**: Asegúrate de que el módulo esté en el volumen mapeado para los addons de Odoo.
2. **Actualizar la lista de módulos**: Ve al menú de aplicaciones de Odoo y activa el modo de desarrollador. Luego, actualiza la lista de módulos.
3. **Instalar el módulo**: Busca `Project Kanban` y haz clic en "Instalar".

Una vez instalado, deberías ver la opción de `Proyectos` en el menú principal y la vista Kanban con las tarjetas de los proyectos en el estilo que deseas.
