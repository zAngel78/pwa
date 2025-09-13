import { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Download } from 'lucide-react';
import toast from 'react-hot-toast';

import Button from './ui/Button';
import Modal from './ui/Modal';
import Select from './ui/Select';

const BulkImport = ({ isOpen, onClose, onSuccess, type = 'customers', title, apiEndpoint }) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Map columns, 3: Preview, 4: Results
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);

  // Configuración por tipo
  const config = {
    customers: {
      requiredFields: ['name'],
      optionalFields: ['tax_id', 'email', 'phone', 'notes'],
      sampleData: {
        name: 'Juan Pérez',
        tax_id: '12.345.678-9',
        email: 'juan@email.com',
        phone: '+56 9 1234 5678',
        notes: 'Cliente frecuente'
      }
    },
    products: {
      requiredFields: ['name', 'unit_price'],
      optionalFields: ['sku', 'brand', 'format', 'unit_of_measure'],
      sampleData: {
        name: 'Producto Ejemplo',
        sku: 'PROD-001',
        brand: 'Marca Ejemplo',
        format: '500ml',
        unit_price: '2500',
        unit_of_measure: 'unidad'
      }
    }
  };

  const currentConfig = config[type];

  const resetState = useCallback(() => {
    setStep(1);
    setFile(null);
    setCsvData([]);
    setHeaders([]);
    setColumnMapping({});
    setResults(null);
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.match(/\.(csv|xlsx|xls)$/)) {
      toast.error('Solo se permiten archivos CSV o Excel');
      return;
    }

    setFile(uploadedFile);
    parseFile(uploadedFile);
  };

  const parseFile = async (file) => {
    try {
      setIsProcessing(true);
      const text = await file.text();

      // Simple CSV parser (assumes comma-separated values)
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        toast.error('El archivo debe tener al menos una fila de encabezados y una fila de datos');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataRows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      setHeaders(headers);
      setCsvData(dataRows);
      setStep(2);
    } catch (error) {
      toast.error('Error al leer el archivo');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleColumnMapping = (csvColumn, systemField) => {
    setColumnMapping(prev => ({
      ...prev,
      [systemField]: csvColumn
    }));
  };

  const generateSampleCSV = () => {
    const headers = Object.keys(currentConfig.sampleData);
    const sampleRow = Object.values(currentConfig.sampleData);

    const csvContent = [
      headers.join(','),
      sampleRow.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `plantilla_${type}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const previewMappedData = () => {
    const preview = csvData.slice(0, 5).map(row => {
      const mappedRow = {};
      Object.entries(columnMapping).forEach(([systemField, csvColumn]) => {
        if (csvColumn) {
          mappedRow[systemField] = row[csvColumn];
        }
      });
      return mappedRow;
    });
    return preview;
  };

  const processImport = async () => {
    try {
      setIsProcessing(true);

      const mappedData = csvData.map(row => {
        const mappedRow = {};
        Object.entries(columnMapping).forEach(([systemField, csvColumn]) => {
          if (csvColumn) {
            mappedRow[systemField] = row[csvColumn];
          }
        });
        return mappedRow;
      });

      // Filtrar filas vacías
      const validData = mappedData.filter(row =>
        currentConfig.requiredFields.some(field => row[field] && row[field].trim())
      );

      if (validData.length === 0) {
        toast.error('No se encontraron filas válidas para importar');
        return;
      }

      const response = await apiEndpoint(validData);

      setResults({
        success: true,
        imported: validData.length,
        total: csvData.length,
        data: response.data
      });
      setStep(4);

      toast.success(`¡${validData.length} ${type === 'customers' ? 'clientes' : 'productos'} importados exitosamente!`);

    } catch (error) {
      console.error('Error importing data:', error);
      setResults({
        success: false,
        error: error.message || 'Error durante la importación',
        imported: 0,
        total: csvData.length
      });
      setStep(4);
      toast.error('Error durante la importación');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinish = () => {
    if (results?.success && results?.data) {
      onSuccess(results.data);
    }
    handleClose();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Subir Archivo
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Selecciona un archivo CSV o Excel con los {type === 'customers' ? 'clientes' : 'productos'} a importar
              </p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="w-full"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-center">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Haz clic para seleccionar archivo o arrástralo aquí
                  </p>
                </div>
              </label>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">
                    ¿No tienes un archivo?
                  </h4>
                  <p className="text-sm text-blue-700 mb-2">
                    Descarga nuestra plantilla para empezar
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={generateSampleCSV}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Descargar Plantilla
                  </Button>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              <p><strong>Campos requeridos:</strong> {currentConfig.requiredFields.join(', ')}</p>
              <p><strong>Campos opcionales:</strong> {currentConfig.optionalFields.join(', ')}</p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Mapear Columnas
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Relaciona las columnas de tu archivo con los campos del sistema
              </p>
            </div>

            <div className="space-y-3">
              {[...currentConfig.requiredFields, ...currentConfig.optionalFields].map(field => (
                <div key={field} className="flex items-center space-x-4">
                  <div className="w-32">
                    <label className="text-sm font-medium text-gray-700">
                      {field}
                      {currentConfig.requiredFields.includes(field) && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                  </div>
                  <div className="flex-1">
                    <Select
                      value={columnMapping[field] || ''}
                      onChange={(e) => handleColumnMapping(e.target.value, field)}
                    >
                      <option value="">-- Seleccionar columna --</option>
                      {headers.map(header => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-between">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Volver
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!currentConfig.requiredFields.every(field => columnMapping[field])}
              >
                Vista Previa
              </Button>
            </div>
          </div>
        );

      case 3:
        const preview = previewMappedData();
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Vista Previa
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Revisa los primeros 5 registros antes de importar
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    {Object.keys(columnMapping).filter(field => columnMapping[field]).map(field => (
                      <th key={field} className="text-left py-2 px-2 font-medium text-gray-900">
                        {field}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      {Object.keys(columnMapping).filter(field => columnMapping[field]).map(field => (
                        <td key={field} className="py-2 px-2 text-gray-700">
                          {row[field] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700">
                ✅ Se importarán <strong>{csvData.length}</strong> {type === 'customers' ? 'clientes' : 'productos'}
              </p>
            </div>

            <div className="flex gap-3 justify-between">
              <Button variant="secondary" onClick={() => setStep(2)}>
                Volver
              </Button>
              <Button onClick={processImport} disabled={isProcessing}>
                {isProcessing ? 'Importando...' : 'Confirmar Importación'}
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center">
              {results?.success ? (
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              ) : (
                <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              )}
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {results?.success ? '¡Importación Exitosa!' : 'Error en Importación'}
              </h3>
            </div>

            {results?.success ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700 text-center">
                  <strong>{results.imported}</strong> de <strong>{results.total}</strong> registros
                  fueron importados exitosamente
                </p>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700 text-center">
                  {results?.error || 'Error desconocido durante la importación'}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button onClick={handleFinish}>
                Finalizar
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      title={`Importación Masiva - ${title}`}
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
    >
      <div className="min-h-[400px]">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map(stepNumber => (
              <div key={stepNumber} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step >= stepNumber
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div className={`
                    w-12 h-0.5 ml-2
                    ${step > stepNumber ? 'bg-emerald-600' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        {renderStep()}
      </div>
    </Modal>
  );
};

export default BulkImport;