"""System-wide NetSuite query definitions and result loading."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict

from .config import SYSTEM_DEFAULTS_RESULTS
from .models import SystemWideQueryDefinition, SystemWideQueryResult

SYSTEM_WIDE_QUERY_DEFINITIONS = [
    SystemWideQueryDefinition(
        query_id="config_active_subsidiaries",
        section="Configuration & Setup",
        title="Get All Active Subsidiaries",
        description="Lists all active subsidiaries with currency and status details.",
        sql=(
            "SELECT id, name, currency, country, state, fiscalcalendar, isinactive, "
            "iselimination FROM subsidiary WHERE isinactive = 'F' ORDER BY name"
        ),
    ),
    SystemWideQueryDefinition(
        query_id="config_departments_hierarchy",
        section="Configuration & Setup",
        title="Get Departments with Hierarchy",
        description="Retrieves departments and their parent relationships.",
        sql=(
            "SELECT d.id, d.name, d.parent, p.name AS parent_name, d.isinactive FROM department d "
            "LEFT JOIN department p ON d.parent = p.id WHERE d.isinactive = 'F' ORDER BY p.name, d.name"
        ),
    ),
    SystemWideQueryDefinition(
        query_id="config_locations",
        section="Configuration & Setup",
        title="Get All Locations",
        description="Returns active locations and their subsidiaries.",
        sql=(
            "SELECT id, name, subsidiary, isinactive, makeinventoryavailable "
            "FROM location WHERE isinactive = 'F'"
        ),
    ),
    SystemWideQueryDefinition(
        query_id="config_business_classifications",
        section="Configuration & Setup",
        title="Get Business Classifications",
        description="Lists active business classifications.",
        sql=(
            "SELECT id, name, parent, isinactive FROM classification WHERE isinactive = 'F' ORDER BY name"
        ),
    ),
    SystemWideQueryDefinition(
        query_id="config_accounting_periods",
        section="Configuration & Setup",
        title="Get Accounting Periods",
        description="Fetches recent accounting periods with status flags.",
        sql=(
            "SELECT periodname, startdate, enddate, closed, isAdjust, isQuarter, isYear, "
            "CASE WHEN startdate <= SYSDATE AND enddate >= SYSDATE THEN 'Y' ELSE 'N' END AS current_period "
            "FROM AccountingPeriod WHERE startdate >= ADD_MONTHS(SYSDATE, -24) ORDER BY startdate DESC"
        ),
    ),
    SystemWideQueryDefinition(
        query_id="config_multibook",
        section="Configuration & Setup",
        title="Check Multi-Book Configuration",
        description="Summarises accounting book configuration.",
        sql=(
            "SELECT id, name, isprimary, basebook, currency, effectiveperiod, status, booktype "
            "FROM AccountingBook ORDER BY isprimary DESC, name"
        ),
    ),
    SystemWideQueryDefinition(
        query_id="config_currencies",
        section="Configuration & Setup",
        title="Get Currency Configuration",
        description="Lists active currencies with exchange information.",
        sql=(
            "SELECT symbol, name, isbasecurrency, exchangerate, currencyprecision FROM currency "
            "WHERE isinactive = 'F' ORDER BY isbasecurrency DESC, symbol"
        ),
    ),
    SystemWideQueryDefinition(
        query_id="config_custom_fields",
        section="Configuration & Setup",
        title="Get Custom Fields by Record Type",
        description="Retrieves active custom fields and metadata.",
        sql=(
            "SELECT scriptid, name, fieldtype, recordtype, ismandatory, defaultvalue, description, "
            "selectrecordtype FROM CustomField WHERE isinactive = 'F' ORDER BY recordtype, name"
        ),
    ),
    SystemWideQueryDefinition(
        query_id="config_custom_records",
        section="Configuration & Setup",
        title="Get Custom Records Structure",
        description="Lists custom record types and capabilities.",
        sql=(
            "SELECT scriptid, name, recordname, includename, showid, allowattachments, "
            "allowinlineediting FROM CustomRecordType ORDER BY name"
        ),
    ),
    SystemWideQueryDefinition(
        query_id="config_roles_permissions",
        section="Configuration & Setup",
        title="Get All Roles and Permissions",
        description="Aggregates active roles and counts active employees per role.",
        sql=(
            "SELECT r.id, r.name, r.isinactive, COUNT(e.id) AS employee_count FROM role r "
            "LEFT JOIN employee e ON r.id = e.role AND e.isinactive = 'F' "
            "WHERE r.isinactive = 'F' GROUP BY r.id, r.name, r.isinactive ORDER BY employee_count DESC"
        ),
    ),
    SystemWideQueryDefinition(
        query_id="master_customer_distribution",
        section="Master Data",
        title="Customer Categories and Status Distribution",
        description="Aggregates active customers by category, status, and terms.",
        sql=(
            "SELECT category, entitystatus, terms, COUNT(*) AS count "
            "FROM customer WHERE isinactive = 'F' GROUP BY category, entitystatus, terms"
        ),
    ),
    SystemWideQueryDefinition(
        query_id="master_vendor_profile",
        section="Master Data",
        title="Vendor Classifications and 1099 Status",
        description="Summarises active vendors with 1099 flags and terms.",
        sql=(
            "SELECT category, is1099eligible, terms, COUNT(*) AS vendor_count "
            "FROM vendor WHERE isinactive = 'F' "
            "GROUP BY category, is1099eligible, terms"
        ),
    ),
    SystemWideQueryDefinition(
        query_id="master_item_distribution",
        section="Master Data",
        title="Item Types and Categories in Use",
        description="Counts items by type/class with serial and lot tracking flags.",
        sql=(
            "SELECT itemtype, COUNT(*) AS item_count "
            "FROM item "
            "WHERE isinactive = 'F' GROUP BY itemtype"
        ),
    ),
    SystemWideQueryDefinition(
        query_id="master_employee_distribution",
        section="Master Data",
        title="Employee Distribution by Role and Department",
        description="Aggregates active employees by department and role.",
        sql=(
            "SELECT e.department, d.name AS dept_name, e.role, r.name AS role_name, COUNT(*) AS employee_count "
            "FROM employee e LEFT JOIN department d ON e.department = d.id "
            "LEFT JOIN role r ON e.role = r.id WHERE e.isinactive = 'F' "
            "GROUP BY e.department, d.name, e.role, r.name ORDER BY employee_count DESC"
        ),
    ),
    SystemWideQueryDefinition(
        query_id="master_chart_of_accounts",
        section="Master Data",
        title="Chart of Accounts Structure",
        description="Lists accounts with type and hierarchy markers.",
        sql=(
            "SELECT accttype, id AS acctnumber, fullname AS acctname, "
            "CASE WHEN parent IS NULL THEN 'Y' ELSE 'N' END AS is_parent, "
            "includechildren, isinactive FROM account WHERE isinactive = 'F'"
        ),
    ),
    SystemWideQueryDefinition(
        query_id="txn_type_usage",
        section="Transaction Analysis",
        title="Transaction Types Actually Used",
        description="Counts transactions by type in the last six months.",
        sql=(
            "SELECT type, COUNT(*) AS usage_count, "
            "MIN(trandate) AS first_used, MAX(trandate) AS last_used FROM transaction "
            "WHERE trandate >= ADD_MONTHS(SYSDATE, -6) GROUP BY type"
        ),
    ),
    SystemWideQueryDefinition(
        query_id="txn_status_distribution",
        section="Transaction Analysis",
        title="Transaction Status Distribution",
        description="Summarises transaction status mix for the last three months.",
        sql=(
            "SELECT type, status, COUNT(*) AS count FROM transaction "
            "WHERE trandate >= ADD_MONTHS(SYSDATE, -3) GROUP BY type, status"
        ),
    ),
    SystemWideQueryDefinition(
        query_id="txn_subsidiary_volume",
        section="Transaction Analysis",
        title="Subsidiary Transaction Volume",
        description="Shows transaction mix and contribution by subsidiary.",
        sql=(
            "SELECT t.subsidiary, s.name AS subsidiary_name, COUNT(*) AS transaction_count, "
            "COUNT(DISTINCT t.type) AS transaction_types, COUNT(DISTINCT t.entity) AS unique_entities, "
            "SUM(t.foreigntotal) AS total_amount, MAX(t.trandate) AS last_activity "
            "FROM transaction t "
            "INNER JOIN subsidiary s ON t.subsidiary = s.id WHERE t.trandate >= ADD_MONTHS(SYSDATE, -3) "
            "GROUP BY t.subsidiary, s.name ORDER BY transaction_count DESC"
        ),
    ),
    SystemWideQueryDefinition(
        query_id="txn_department_location",
        section="Transaction Analysis",
        title="Department and Location Usage",
        description="Aggregates transactions by department and location over the last quarter.",
        sql=(
            "SELECT d.name AS department, l.name AS location, COUNT(*) AS transaction_count, "
            "COUNT(DISTINCT t.entity) AS unique_entities, COUNT(DISTINCT t.createdby) AS unique_users, "
            "LISTAGG(DISTINCT t.type, ', ') WITHIN GROUP (ORDER BY t.type) AS transaction_types FROM transaction t "
            "LEFT JOIN department d ON t.department = d.id LEFT JOIN location l ON t.location = l.id "
            "WHERE t.trandate >= ADD_MONTHS(SYSDATE, -3) GROUP BY d.name, l.name HAVING COUNT(*) > 10 "
            "ORDER BY transaction_count DESC"
        ),
    ),
    SystemWideQueryDefinition(
        query_id="txn_intercompany_analysis",
        section="Transaction Analysis",
        title="Intercompany Transaction Analysis",
        description="Summarises intercompany flows over the last six months.",
        sql=(
            "SELECT t.subsidiary, t.type, "
            "COUNT(*) AS transaction_count FROM transaction t "
            "WHERE t.trandate >= ADD_MONTHS(SYSDATE, -6) "
            "GROUP BY t.subsidiary, t.type ORDER BY transaction_count DESC"
        ),
    ),
]


def load_system_default_results(path: Path | None = None) -> Dict[str, SystemWideQueryResult]:
    """Load cached system default results if present."""

    target_path = path or SYSTEM_DEFAULTS_RESULTS
    if not target_path.exists():
        return {}

    with target_path.open() as handle:
        raw = json.load(handle)

    results: Dict[str, SystemWideQueryResult] = {}
    for entry in raw:
        try:
            result = SystemWideQueryResult(**entry)
        except Exception:  # pylint: disable=broad-except
            continue
        results[result.query_id] = result

    return results
