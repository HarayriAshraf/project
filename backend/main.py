import os
import json
import pyodbc
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Any
from contextlib import contextmanager

load_dotenv()

app = FastAPI(title="SupplyChain Pro API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "*")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Database connection
# ---------------------------------------------------------------------------

def get_connection():
    server = os.getenv("DB_SERVER", r".\SQLEXPRESS")
    database = os.getenv("DB_DATABASE", "SupplyChainPro")
    user = os.getenv("DB_USER", "")
    password = os.getenv("DB_PASSWORD", "")
    driver = os.getenv("DB_DRIVER", "{ODBC Driver 18 for SQL Server}")
    encrypt = os.getenv("DB_ENCRYPT", "no")
    trust_cert = os.getenv("DB_TRUST_CERT", "yes")

    if user:
        conn_str = (
            f"DRIVER={driver};"
            f"SERVER={server};"
            f"DATABASE={database};"
            f"UID={user};"
            f"PWD={password};"
            f"Encrypt={encrypt};"
            f"TrustServerCertificate={trust_cert};"
        )
    else:
        # Windows Authentication (no username/password)
        conn_str = (
            f"DRIVER={driver};"
            f"SERVER={server};"
            f"DATABASE={database};"
            f"Trusted_Connection=yes;"
            f"Encrypt={encrypt};"
            f"TrustServerCertificate={trust_cert};"
        )
    return pyodbc.connect(conn_str)

@contextmanager
def db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class ForecastRecord(BaseModel):
    id: str
    section: Optional[str] = ""
    client: Optional[str] = ""
    country: Optional[str] = ""
    product: Optional[str] = ""
    category: Optional[str] = ""
    month: Optional[int] = 1
    year: Optional[int] = 2025
    version: Optional[str] = ""
    qty: Optional[float] = 0
    sales: Optional[float] = 0
    gp: Optional[float] = 0
    salesPerson: Optional[str] = ""
    salesPersonEmail: Optional[str] = ""
    status: Optional[str] = "Draft"
    workflowStatus: Optional[str] = "Draft"
    subsidiary: Optional[str] = ""
    invoicingMonth: Optional[int] = None
    invoicingYear: Optional[int] = None


class AuditLog(BaseModel):
    id: str
    timestamp: Optional[str] = ""
    userEmail: Optional[str] = ""
    recordId: Optional[str] = ""
    product: Optional[str] = ""
    actionType: Optional[str] = ""
    reasonCode: Optional[str] = ""
    details: Optional[str] = ""
    client: Optional[str] = ""
    subsidiary: Optional[str] = ""
    section: Optional[str] = ""
    salesRep: Optional[str] = ""
    month: Optional[int] = 0
    year: Optional[int] = 0
    previousMonth: Optional[int] = None
    previousYear: Optional[int] = None
    previousQty: Optional[float] = 0
    newQty: Optional[float] = 0
    previousSales: Optional[float] = 0
    newSales: Optional[float] = 0
    previousGP: Optional[float] = 0
    newGP: Optional[float] = 0


class Client(BaseModel):
    id: str
    name: str
    country: Optional[str] = ""
    salesRepName: Optional[str] = ""
    salesRepEmail: Optional[str] = ""
    subsidiary: Optional[str] = ""
    section: Optional[str] = "Trade"


class BOMItem(BaseModel):
    productId: str
    qty: float


class Product(BaseModel):
    id: str
    name: str
    category: Optional[str] = ""
    hasBOM: Optional[bool] = False
    bom: Optional[List[BOMItem]] = []
    leadTimeWeeks: Optional[int] = 1


class Supplier(BaseModel):
    id: str
    name: str
    country: Optional[str] = ""


class PurchaseOrder(BaseModel):
    id: str
    supplierId: str
    productId: str
    quantity: Optional[float] = 0
    orderDate: Optional[str] = ""
    leadTimeWeeks: Optional[int] = 0
    expectedDeliveryDate: Optional[str] = ""
    actualDeliveryDate: Optional[str] = None
    status: Optional[str] = "Pending"


class CRMUpdate(BaseModel):
    id: str
    date: Optional[str] = ""
    stage: Optional[str] = ""
    purpose: Optional[str] = ""
    notes: Optional[str] = ""
    material: Optional[str] = ""
    clientPrice: Optional[float] = None
    supplierPrice: Optional[float] = None
    clientPaymentTerm: Optional[str] = ""
    supplierPaymentTerm: Optional[str] = ""
    supplierName: Optional[str] = ""


class CRMActivity(BaseModel):
    id: str
    clientId: Optional[str] = ""
    clientName: Optional[str] = ""
    contactPerson: Optional[str] = ""
    contactInfo: Optional[str] = ""
    contactPersonEmail: Optional[str] = ""
    contactPersonPhone: Optional[str] = ""
    salesRepName: Optional[str] = ""
    salesRepEmail: Optional[str] = ""
    subsidiary: Optional[str] = ""
    clientSector: Optional[str] = ""
    country: Optional[str] = ""
    date: Optional[str] = ""
    timestamp: Optional[str] = ""
    stage: Optional[str] = ""
    purpose: Optional[str] = ""
    notes: Optional[str] = ""
    leadSource: Optional[str] = ""
    potentialValue: Optional[float] = 0
    material: Optional[str] = ""
    clientPrice: Optional[float] = None
    supplierPrice: Optional[float] = None
    clientPaymentTerm: Optional[str] = ""
    supplierPaymentTerm: Optional[str] = ""
    supplierName: Optional[str] = ""
    updates: Optional[List[CRMUpdate]] = []


class ActionItemUpdate(BaseModel):
    id: str
    date: Optional[str] = ""
    status: Optional[str] = ""
    notes: Optional[str] = ""
    timestamp: Optional[str] = ""


class ActionItem(BaseModel):
    id: Optional[int] = None
    title: str
    description: Optional[str] = ""
    company: Optional[str] = ""
    status: Optional[str] = "Open"
    date_opened: Optional[str] = ""
    due_date: Optional[str] = ""
    meeting_topic: Optional[str] = ""
    assignee_email: Optional[str] = ""
    assignee_name: Optional[str] = ""
    subsidiary: Optional[str] = ""
    notes: Optional[str] = ""
    updates: Optional[List[ActionItemUpdate]] = []


class User(BaseModel):
    id: str
    email: str
    name: str
    roleId: Optional[str] = ""
    role: Optional[str] = ""
    subsidiary: Optional[str] = ""


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {"status": "SupplyChain Pro API running"}


@app.get("/api/health")
def health():
    try:
        with db() as conn:
            conn.cursor().execute("SELECT 1")
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": str(e)}


# ---------------------------------------------------------------------------
# Forecast Records
# ---------------------------------------------------------------------------

@app.get("/api/forecasts", response_model=List[ForecastRecord])
def get_forecasts():
    with db() as conn:
        rows = conn.cursor().execute(
            "SELECT * FROM forecast_records ORDER BY year, month"
        ).fetchall()
        cols = [d[0] for d in conn.cursor().description] if False else [
            "id","section","client","country","product","category","month","year",
            "version","qty","sales","gp","salesPerson","salesPersonEmail","status",
            "workflowStatus","subsidiary","invoicingMonth","invoicingYear"
        ]
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id,section,client,country,product,category,month,year,version,qty,sales,gp,salesPerson,salesPersonEmail,status,workflowStatus,subsidiary,invoicingMonth,invoicingYear FROM forecast_records ORDER BY year, month")
        cols = [d[0] for d in cursor.description]
        return [dict(zip(cols, row)) for row in cursor.fetchall()]


@app.post("/api/forecasts/batch", response_model=List[ForecastRecord])
def upsert_forecasts_batch(records: List[ForecastRecord]):
    with db() as conn:
        cursor = conn.cursor()
        for r in records:
            cursor.execute("""
                IF EXISTS (SELECT 1 FROM forecast_records WHERE id=?)
                    UPDATE forecast_records SET section=?,client=?,country=?,product=?,category=?,
                        month=?,year=?,version=?,qty=?,sales=?,gp=?,salesPerson=?,salesPersonEmail=?,
                        status=?,workflowStatus=?,subsidiary=?,invoicingMonth=?,invoicingYear=?
                    WHERE id=?
                ELSE
                    INSERT INTO forecast_records (id,section,client,country,product,category,month,year,
                        version,qty,sales,gp,salesPerson,salesPersonEmail,status,workflowStatus,subsidiary,
                        invoicingMonth,invoicingYear)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            r.id,
            r.section,r.client,r.country,r.product,r.category,r.month,r.year,r.version,
            r.qty,r.sales,r.gp,r.salesPerson,r.salesPersonEmail,r.status,r.workflowStatus,
            r.subsidiary,r.invoicingMonth,r.invoicingYear,r.id,
            r.id,r.section,r.client,r.country,r.product,r.category,r.month,r.year,r.version,
            r.qty,r.sales,r.gp,r.salesPerson,r.salesPersonEmail,r.status,r.workflowStatus,
            r.subsidiary,r.invoicingMonth,r.invoicingYear
            )
    return records


@app.put("/api/forecasts/{record_id}", response_model=ForecastRecord)
def update_forecast(record_id: str, r: ForecastRecord):
    with db() as conn:
        conn.cursor().execute("""
            UPDATE forecast_records SET section=?,client=?,country=?,product=?,category=?,
                month=?,year=?,version=?,qty=?,sales=?,gp=?,salesPerson=?,salesPersonEmail=?,
                status=?,workflowStatus=?,subsidiary=?,invoicingMonth=?,invoicingYear=?
            WHERE id=?
        """,
        r.section,r.client,r.country,r.product,r.category,r.month,r.year,r.version,
        r.qty,r.sales,r.gp,r.salesPerson,r.salesPersonEmail,r.status,r.workflowStatus,
        r.subsidiary,r.invoicingMonth,r.invoicingYear,record_id)
    return r


@app.delete("/api/forecasts/{record_id}")
def delete_forecast(record_id: str):
    with db() as conn:
        conn.cursor().execute("DELETE FROM forecast_records WHERE id=?", record_id)
    return {"deleted": record_id}


# ---------------------------------------------------------------------------
# Audit Logs
# ---------------------------------------------------------------------------

@app.get("/api/audit-logs", response_model=List[AuditLog])
def get_audit_logs():
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id,timestamp,userEmail,recordId,product,actionType,reasonCode,details,
                   client,subsidiary,section,salesRep,month,year,previousMonth,previousYear,
                   previousQty,newQty,previousSales,newSales,previousGP,newGP
            FROM audit_logs ORDER BY timestamp DESC
        """)
        cols = [d[0] for d in cursor.description]
        return [dict(zip(cols, row)) for row in cursor.fetchall()]


@app.post("/api/audit-logs", response_model=AuditLog)
def create_audit_log(log: AuditLog):
    with db() as conn:
        conn.cursor().execute("""
            INSERT INTO audit_logs (id,timestamp,userEmail,recordId,product,actionType,reasonCode,
                details,client,subsidiary,section,salesRep,month,year,previousMonth,previousYear,
                previousQty,newQty,previousSales,newSales,previousGP,newGP)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """,
        log.id,log.timestamp,log.userEmail,log.recordId,log.product,log.actionType,
        log.reasonCode,log.details,log.client,log.subsidiary,log.section,log.salesRep,
        log.month,log.year,log.previousMonth,log.previousYear,
        log.previousQty,log.newQty,log.previousSales,log.newSales,log.previousGP,log.newGP)
    return log


@app.post("/api/audit-logs/batch", response_model=List[AuditLog])
def create_audit_logs_batch(logs: List[AuditLog]):
    for log in logs:
        create_audit_log(log)
    return logs


# ---------------------------------------------------------------------------
# Clients
# ---------------------------------------------------------------------------

@app.get("/api/clients", response_model=List[Client])
def get_clients():
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id,name,country,salesRepName,salesRepEmail,subsidiary,section FROM clients ORDER BY name")
        cols = [d[0] for d in cursor.description]
        return [dict(zip(cols, row)) for row in cursor.fetchall()]


@app.post("/api/clients", response_model=Client)
def create_client(c: Client):
    with db() as conn:
        conn.cursor().execute("""
            INSERT INTO clients (id,name,country,salesRepName,salesRepEmail,subsidiary,section)
            VALUES (?,?,?,?,?,?,?)
        """, c.id,c.name,c.country,c.salesRepName,c.salesRepEmail,c.subsidiary,c.section)
    return c


@app.put("/api/clients/{client_id}", response_model=Client)
def update_client(client_id: str, c: Client):
    with db() as conn:
        conn.cursor().execute("""
            UPDATE clients SET name=?,country=?,salesRepName=?,salesRepEmail=?,subsidiary=?,section=?
            WHERE id=?
        """, c.name,c.country,c.salesRepName,c.salesRepEmail,c.subsidiary,c.section,client_id)
    return c


@app.delete("/api/clients/{client_id}")
def delete_client(client_id: str):
    with db() as conn:
        conn.cursor().execute("DELETE FROM clients WHERE id=?", client_id)
    return {"deleted": client_id}


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------

@app.get("/api/products", response_model=List[Product])
def get_products():
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id,name,category,hasBOM,leadTimeWeeks FROM products ORDER BY name")
        cols = [d[0] for d in cursor.description]
        products = [dict(zip(cols, row)) for row in cursor.fetchall()]

        # Load BOM items
        for p in products:
            cursor.execute("SELECT componentId,qty FROM product_bom WHERE productId=?", p["id"])
            p["bom"] = [{"productId": row[0], "qty": row[1]} for row in cursor.fetchall()]
            p["hasBOM"] = bool(p["hasBOM"])
        return products


@app.post("/api/products", response_model=Product)
def create_product(p: Product):
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO products (id,name,category,hasBOM,leadTimeWeeks)
            VALUES (?,?,?,?,?)
        """, p.id, p.name, p.category, 1 if p.hasBOM else 0, p.leadTimeWeeks)
        if p.bom:
            for item in p.bom:
                cursor.execute(
                    "INSERT INTO product_bom (productId,componentId,qty) VALUES (?,?,?)",
                    p.id, item.productId, item.qty
                )
    return p


@app.put("/api/products/{product_id}", response_model=Product)
def update_product(product_id: str, p: Product):
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE products SET name=?,category=?,hasBOM=?,leadTimeWeeks=? WHERE id=?
        """, p.name, p.category, 1 if p.hasBOM else 0, p.leadTimeWeeks, product_id)
        cursor.execute("DELETE FROM product_bom WHERE productId=?", product_id)
        if p.bom:
            for item in p.bom:
                cursor.execute(
                    "INSERT INTO product_bom (productId,componentId,qty) VALUES (?,?,?)",
                    product_id, item.productId, item.qty
                )
    return p


@app.delete("/api/products/{product_id}")
def delete_product(product_id: str):
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM product_bom WHERE productId=?", product_id)
        cursor.execute("DELETE FROM products WHERE id=?", product_id)
    return {"deleted": product_id}


# ---------------------------------------------------------------------------
# Suppliers
# ---------------------------------------------------------------------------

@app.get("/api/suppliers", response_model=List[Supplier])
def get_suppliers():
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id,name,country FROM suppliers ORDER BY name")
        cols = [d[0] for d in cursor.description]
        return [dict(zip(cols, row)) for row in cursor.fetchall()]


@app.post("/api/suppliers", response_model=Supplier)
def create_supplier(s: Supplier):
    with db() as conn:
        conn.cursor().execute("INSERT INTO suppliers (id,name,country) VALUES (?,?,?)", s.id,s.name,s.country)
    return s


@app.put("/api/suppliers/{supplier_id}", response_model=Supplier)
def update_supplier(supplier_id: str, s: Supplier):
    with db() as conn:
        conn.cursor().execute("UPDATE suppliers SET name=?,country=? WHERE id=?", s.name,s.country,supplier_id)
    return s


@app.delete("/api/suppliers/{supplier_id}")
def delete_supplier(supplier_id: str):
    with db() as conn:
        conn.cursor().execute("DELETE FROM suppliers WHERE id=?", supplier_id)
    return {"deleted": supplier_id}


# ---------------------------------------------------------------------------
# Purchase Orders
# ---------------------------------------------------------------------------

@app.get("/api/purchase-orders", response_model=List[PurchaseOrder])
def get_purchase_orders():
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id,supplierId,productId,quantity,orderDate,leadTimeWeeks,
                   expectedDeliveryDate,actualDeliveryDate,status
            FROM purchase_orders ORDER BY orderDate DESC
        """)
        cols = [d[0] for d in cursor.description]
        return [dict(zip(cols, row)) for row in cursor.fetchall()]


@app.post("/api/purchase-orders", response_model=PurchaseOrder)
def create_purchase_order(po: PurchaseOrder):
    with db() as conn:
        conn.cursor().execute("""
            INSERT INTO purchase_orders (id,supplierId,productId,quantity,orderDate,leadTimeWeeks,
                expectedDeliveryDate,actualDeliveryDate,status)
            VALUES (?,?,?,?,?,?,?,?,?)
        """, po.id,po.supplierId,po.productId,po.quantity,po.orderDate,po.leadTimeWeeks,
             po.expectedDeliveryDate,po.actualDeliveryDate,po.status)
    return po


@app.put("/api/purchase-orders/{po_id}", response_model=PurchaseOrder)
def update_purchase_order(po_id: str, po: PurchaseOrder):
    with db() as conn:
        conn.cursor().execute("""
            UPDATE purchase_orders SET supplierId=?,productId=?,quantity=?,orderDate=?,
                leadTimeWeeks=?,expectedDeliveryDate=?,actualDeliveryDate=?,status=?
            WHERE id=?
        """, po.supplierId,po.productId,po.quantity,po.orderDate,po.leadTimeWeeks,
             po.expectedDeliveryDate,po.actualDeliveryDate,po.status,po_id)
    return po


@app.delete("/api/purchase-orders/{po_id}")
def delete_purchase_order(po_id: str):
    with db() as conn:
        conn.cursor().execute("DELETE FROM purchase_orders WHERE id=?", po_id)
    return {"deleted": po_id}


# ---------------------------------------------------------------------------
# CRM Activities
# ---------------------------------------------------------------------------

@app.get("/api/crm-activities", response_model=List[CRMActivity])
def get_crm_activities():
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id,clientId,clientName,contactPerson,contactInfo,contactPersonEmail,
                   contactPersonPhone,salesRepName,salesRepEmail,subsidiary,clientSector,
                   country,date,timestamp,stage,purpose,notes,leadSource,potentialValue,
                   material,clientPrice,supplierPrice,clientPaymentTerm,supplierPaymentTerm,supplierName
            FROM crm_activities ORDER BY date DESC
        """)
        cols = [d[0] for d in cursor.description]
        activities = [dict(zip(cols, row)) for row in cursor.fetchall()]

        for a in activities:
            cursor.execute("""
                SELECT id,date,stage,purpose,notes,material,clientPrice,supplierPrice,
                       clientPaymentTerm,supplierPaymentTerm,supplierName
                FROM crm_updates WHERE activityId=? ORDER BY date
            """, a["id"])
            ucols = [d[0] for d in cursor.description]
            a["updates"] = [dict(zip(ucols, row)) for row in cursor.fetchall()]
        return activities


@app.post("/api/crm-activities", response_model=CRMActivity)
def create_crm_activity(a: CRMActivity):
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO crm_activities (id,clientId,clientName,contactPerson,contactInfo,
                contactPersonEmail,contactPersonPhone,salesRepName,salesRepEmail,subsidiary,
                clientSector,country,date,timestamp,stage,purpose,notes,leadSource,
                potentialValue,material,clientPrice,supplierPrice,clientPaymentTerm,
                supplierPaymentTerm,supplierName)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """,
        a.id,a.clientId,a.clientName,a.contactPerson,a.contactInfo,a.contactPersonEmail,
        a.contactPersonPhone,a.salesRepName,a.salesRepEmail,a.subsidiary,a.clientSector,
        a.country,a.date,a.timestamp,a.stage,a.purpose,a.notes,a.leadSource,
        a.potentialValue,a.material,a.clientPrice,a.supplierPrice,
        a.clientPaymentTerm,a.supplierPaymentTerm,a.supplierName)
        _upsert_crm_updates(cursor, a.id, a.updates or [])
    return a


@app.put("/api/crm-activities/{activity_id}", response_model=CRMActivity)
def update_crm_activity(activity_id: str, a: CRMActivity):
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE crm_activities SET clientId=?,clientName=?,contactPerson=?,contactInfo=?,
                contactPersonEmail=?,contactPersonPhone=?,salesRepName=?,salesRepEmail=?,
                subsidiary=?,clientSector=?,country=?,date=?,timestamp=?,stage=?,purpose=?,
                notes=?,leadSource=?,potentialValue=?,material=?,clientPrice=?,supplierPrice=?,
                clientPaymentTerm=?,supplierPaymentTerm=?,supplierName=?
            WHERE id=?
        """,
        a.clientId,a.clientName,a.contactPerson,a.contactInfo,a.contactPersonEmail,
        a.contactPersonPhone,a.salesRepName,a.salesRepEmail,a.subsidiary,a.clientSector,
        a.country,a.date,a.timestamp,a.stage,a.purpose,a.notes,a.leadSource,
        a.potentialValue,a.material,a.clientPrice,a.supplierPrice,
        a.clientPaymentTerm,a.supplierPaymentTerm,a.supplierName,activity_id)
        cursor.execute("DELETE FROM crm_updates WHERE activityId=?", activity_id)
        _upsert_crm_updates(cursor, activity_id, a.updates or [])
    return a


def _upsert_crm_updates(cursor, activity_id: str, updates: List[CRMUpdate]):
    for u in updates:
        cursor.execute("""
            INSERT INTO crm_updates (id,activityId,date,stage,purpose,notes,material,
                clientPrice,supplierPrice,clientPaymentTerm,supplierPaymentTerm,supplierName)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
        """,
        u.id,activity_id,u.date,u.stage,u.purpose,u.notes,u.material,
        u.clientPrice,u.supplierPrice,u.clientPaymentTerm,u.supplierPaymentTerm,u.supplierName)


# ---------------------------------------------------------------------------
# Action Items
# ---------------------------------------------------------------------------

@app.get("/api/action-items", response_model=List[ActionItem])
def get_action_items():
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id,title,description,company,status,date_opened,due_date,meeting_topic,
                   assignee_email,assignee_name,subsidiary,notes
            FROM action_items ORDER BY date_opened DESC
        """)
        cols = [d[0] for d in cursor.description]
        items = [dict(zip(cols, row)) for row in cursor.fetchall()]

        for item in items:
            cursor.execute("""
                SELECT id,date,status,notes,timestamp FROM action_item_updates
                WHERE action_item_id=? ORDER BY date
            """, item["id"])
            ucols = [d[0] for d in cursor.description]
            item["updates"] = [dict(zip(ucols, row)) for row in cursor.fetchall()]
        return items


@app.post("/api/action-items", response_model=ActionItem)
def create_action_item(item: ActionItem):
    date_opened = item.date_opened if item.date_opened else None
    due_date = item.due_date if item.due_date else None
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO action_items (title,description,company,status,date_opened,due_date,
                meeting_topic,assignee_email,assignee_name,subsidiary,notes)
            OUTPUT INSERTED.id
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
        """,
        item.title, item.description or '', item.company or '', item.status or 'Open',
        date_opened, due_date, item.meeting_topic or '', item.assignee_email or '',
        item.assignee_name or '', item.subsidiary or '', item.notes or '')
        row = cursor.fetchone()
        new_id = int(row[0]) if row else 0
        item.id = new_id
        if item.updates:
            _upsert_action_updates(cursor, new_id, item.updates)
    return item


@app.put("/api/action-items/{item_id}", response_model=ActionItem)
def update_action_item(item_id: int, item: ActionItem):
    date_opened = item.date_opened if item.date_opened else None
    due_date = item.due_date if item.due_date else None
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE action_items SET title=?,description=?,company=?,status=?,date_opened=?,
                due_date=?,meeting_topic=?,assignee_email=?,assignee_name=?,subsidiary=?,notes=?
            WHERE id=?
        """,
        item.title, item.description or '', item.company or '', item.status or 'Open',
        date_opened, due_date, item.meeting_topic or '', item.assignee_email or '',
        item.assignee_name or '', item.subsidiary or '', item.notes or '', item_id)
        if item.updates:
            _upsert_action_updates(cursor, item_id, item.updates)
    return item


@app.delete("/api/action-items/{item_id}")
def delete_action_item(item_id: int):
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM action_item_updates WHERE action_item_id=?", item_id)
        cursor.execute("DELETE FROM action_items WHERE id=?", item_id)
    return {"deleted": item_id}


def _upsert_action_updates(cursor, item_id: int, updates: List[ActionItemUpdate]):
    for u in updates:
        date_val = u.date if u.date else None
        cursor.execute("""
            IF NOT EXISTS (SELECT 1 FROM action_item_updates WHERE id=?)
                INSERT INTO action_item_updates (id,action_item_id,date,status,notes,timestamp)
                VALUES (?,?,?,?,?,?)
        """, u.id, u.id, item_id, date_val, u.status or '', u.notes or '', u.timestamp or '')


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

@app.get("/api/users", response_model=List[User])
def get_users():
    with db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id,email,name,roleId,role,subsidiary FROM users ORDER BY name")
        cols = [d[0] for d in cursor.description]
        return [dict(zip(cols, row)) for row in cursor.fetchall()]


@app.post("/api/users", response_model=User)
def create_user(u: User):
    with db() as conn:
        conn.cursor().execute("""
            IF NOT EXISTS (SELECT 1 FROM users WHERE id=?)
                INSERT INTO users (id,email,name,roleId,role,subsidiary)
                VALUES (?,?,?,?,?,?)
        """, u.id, u.id,u.email,u.name,u.roleId,u.role,u.subsidiary)
    return u


@app.put("/api/users/{user_id}", response_model=User)
def update_user(user_id: str, u: User):
    with db() as conn:
        conn.cursor().execute("""
            UPDATE users SET email=?,name=?,roleId=?,role=?,subsidiary=? WHERE id=?
        """, u.email,u.name,u.roleId,u.role,u.subsidiary,user_id)
    return u


@app.delete("/api/users/{user_id}")
def delete_user(user_id: str):
    with db() as conn:
        conn.cursor().execute("DELETE FROM users WHERE id=?", user_id)
    return {"deleted": user_id}
