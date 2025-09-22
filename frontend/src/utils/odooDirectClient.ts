// Direct Odoo XML-RPC client for frontend (temporary solution)
// WARNING: This exposes credentials in the frontend - use only for testing!

interface OdooConfig {
  url: string;
  db: string;
  username: string;
  password: string;
}

class DirectOdooClient {
  private config: OdooConfig;
  private uid?: number;

  constructor() {
    // WARNING: These credentials will be visible in the browser!
    this.config = {
      url: 'https://source-gym-plus-coffee.odoo.com',
      db: 'source-gym-plus-coffee',
      username: 'admin@quickfindai.com',
      password: 'BJ62wX2J4yzjS$i'
    };
  }

  private async xmlRpcCall(endpoint: string, method: string, params: any[]): Promise<any> {
    const xmlRequest = this.buildXmlRequest(method, params);
    
    const response = await fetch(`${this.config.url}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Accept': 'text/xml',
      },
      body: xmlRequest
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xmlResponse = await response.text();
    return this.parseXmlResponse(xmlResponse);
  }

  private buildXmlRequest(method: string, params: any[]): string {
    const xmlParams = params.map(param => this.valueToXml(param)).join('');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<methodCall>
  <methodName>${method}</methodName>
  <params>
    ${xmlParams}
  </params>
</methodCall>`;
  }

  private valueToXml(value: any): string {
    if (value === null || value === undefined) {
      return '<param><value><nil/></value></param>';
    }

    if (typeof value === 'string') {
      return `<param><value><string>${this.escapeXml(value)}</string></value></param>`;
    }

    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return `<param><value><int>${value}</int></value></param>`;
      }
      return `<param><value><double>${value}</double></value></param>`;
    }

    if (typeof value === 'boolean') {
      return `<param><value><boolean>${value ? 1 : 0}</boolean></value></param>`;
    }

    if (Array.isArray(value)) {
      const arrayItems = value.map(item => 
        this.valueToXml(item).replace(/<\/?param>/g, '')
      ).join('');
      return `<param><value><array><data>${arrayItems}</data></array></value></param>`;
    }

    if (typeof value === 'object') {
      const members = Object.entries(value).map(([key, val]) => 
        `<member>
          <name>${this.escapeXml(key)}</name>
          ${this.valueToXml(val).replace(/<\/?param>/g, '')}
        </member>`
      ).join('');
      return `<param><value><struct>${members}</struct></value></param>`;
    }

    return '<param><value><string></string></value></param>';
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private parseXmlResponse(xml: string): any {
    // Check for fault
    if (xml.includes('<fault>')) {
      const faultMatch = xml.match(/<fault>.*?<value><struct>(.*?)<\/struct><\/value>.*?<\/fault>/s);
      if (faultMatch) {
        throw new Error(`Odoo XML-RPC Fault: ${xml}`);
      }
    }

    // Extract the value from the response
    const valueMatch = xml.match(/<params>\s*<param>\s*<value>(.*?)<\/value>\s*<\/param>\s*<\/params>/s);
    if (!valueMatch) {
      throw new Error('Invalid XML-RPC response format');
    }

    return this.parseValue(valueMatch[1]);
  }

  private parseValue(xml: string): any {
    xml = xml.trim();
    
    // Array
    if (xml.startsWith('<array>')) {
      const dataMatch = xml.match(/<data>(.*?)<\/data>/s);
      if (!dataMatch) return [];
      
      const values: any[] = [];
      const dataContent = dataMatch[1];
      
      // Simple regex approach for array parsing
      const valueRegex = /<value>(.*?)<\/value>/gs;
      let match;
      while ((match = valueRegex.exec(dataContent)) !== null) {
        values.push(this.parseValue(match[1]));
      }
      
      return values;
    }

    // Struct (object)
    if (xml.startsWith('<struct>')) {
      const obj: any = {};
      const memberRegex = /<member>\s*<name>(.*?)<\/name>\s*<value>(.*?)<\/value>\s*<\/member>/gs;
      let match;
      while ((match = memberRegex.exec(xml)) !== null) {
        obj[this.unescapeXml(match[1])] = this.parseValue(match[2]);
      }
      return obj;
    }

    // String
    if (xml.startsWith('<string>')) {
      const match = xml.match(/^<string>(.*?)<\/string>$/s);
      return match ? this.unescapeXml(match[1]) : '';
    }

    // Integer
    if (xml.startsWith('<int>') || xml.startsWith('<i4>')) {
      const match = xml.match(/^<(?:int|i4)>(-?\d+)<\/(?:int|i4)>$/);
      return match ? parseInt(match[1]) : 0;
    }

    // Double
    if (xml.startsWith('<double>')) {
      const match = xml.match(/^<double>(-?[\d.]+)<\/double>$/);
      return match ? parseFloat(match[1]) : 0;
    }

    // Boolean
    if (xml.startsWith('<boolean>')) {
      const match = xml.match(/^<boolean>([01])<\/boolean>$/);
      return match ? match[1] === '1' : false;
    }

    // Nil/null
    if (xml === '<nil/>' || xml.startsWith('<nil/>')) {
      return null;
    }

    // Default to string content
    return xml;
  }

  private unescapeXml(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  }

  async connect(): Promise<number> {
    if (this.uid) return this.uid;

    console.log('🔵 [DirectOdooClient] Authenticating with Odoo...');
    
    this.uid = await this.xmlRpcCall('/xmlrpc/2/common', 'authenticate', [
      this.config.db,
      this.config.username,
      this.config.password,
      {}
    ]);

    if (!this.uid) {
      throw new Error('Odoo authentication failed');
    }

    console.log('✅ [DirectOdooClient] Authenticated, UID:', this.uid);
    return this.uid;
  }

  async searchRead(
    model: string,
    domain: any[] = [],
    fields: string[] = [],
    offset: number = 0,
    limit: number = 100
  ): Promise<any[]> {
    if (!this.uid) {
      await this.connect();
    }

    const fieldsToUse = fields.length > 0 ? fields : ['id', 'name'];
    
    console.log(`🔵 [DirectOdooClient] search_read ${model}:`, {
      domain,
      fields: fieldsToUse,
      offset,
      limit
    });

    // Use the EXACT same structure that works in Node.js tests
    const result = await this.xmlRpcCall('/xmlrpc/2/object', 'execute_kw', [
      this.config.db,
      this.uid,
      this.config.password,
      model,
      'search_read',
      [domain],  // args: domain wrapped in array
      {          // kwargs: options as separate parameter
        fields: fieldsToUse,
        offset: offset,
        limit: limit
      }
    ]);

    console.log(`✅ [DirectOdooClient] Found ${result?.length || 0} records`);
    return result || [];
  }

  async searchCount(model: string, domain: any[] = []): Promise<number> {
    if (!this.uid) {
      await this.connect();
    }

    const result = await this.xmlRpcCall('/xmlrpc/2/object', 'execute_kw', [
      this.config.db,
      this.uid,
      this.config.password,
      model,
      'search_count',
      [domain]
    ]);

    return result || 0;
  }
}

// Export singleton instance
export const directOdooClient = new DirectOdooClient();