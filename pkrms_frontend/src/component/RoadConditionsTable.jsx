import React, { useState, useEffect } from 'react';
import '../css/RoadConditionsTable.css';

const statusMap = {
  2: { label: 'Good', color: 'bg-green-100 text-green-800' },
  3: { label: 'Fair', color: 'bg-yellow-100 text-yellow-800' },
};

const columnConfig = {
  linkId: { header: 'Link ID' },
  chainageFrom: { header: 'From (m)' },
  chainageTo: { header: 'To (m)' },
  year: { header: 'Year' },
  sectionStatus: {
    header: 'Status',
    render: (value) => (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
        statusMap[value]?.color || 'bg-gray-200 text-gray-700'
      }`}>
        {statusMap[value]?.label || 'Unknown'}
      </span>
    ),
  },
  potholeCount: {
    header: 'Potholes',
    render: (value) => value ?? 'N/A',
  },
  ruttingDepth: {
    header: 'Rutting (mm)',
    render: (value) => value ?? 'N/A',
  },
  roadMarkingL: {
    header: 'Marking L',
    render: (value) => (
      <span className={`inline-block w-6 h-6 rounded-full text-center font-bold ${
        value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {value ? '✓' : '✕'}
      </span>
    ),
  },
  roadMarkingR: {
    header: 'Marking R',
    render: (value) => (
      <span className={`inline-block w-6 h-6 rounded-full text-center font-bold ${
        value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {value ? '✓' : '✕'}
      </span>
    ),
  },
};

const RoadConditionsTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://108.137.190.199/api/roadConditins/')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const allColumns = data.length > 0 ? Object.keys(data[0]) : [];
  const columns = allColumns.filter((col) => col !== 'id');

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-500 py-4">Error: {error}</p>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Road Condition Reports</h2>
      <div className="overflow-x-auto shadow-xl rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-300 bg-white">
          <thead className="bg-blue-100">
            <tr>
              {columns.map((key) => {
                const config = columnConfig[key];
                return (
                  <th
                    key={key}
                    className="px-6 py-3 text-left text-sm font-semibold text-blue-800 uppercase tracking-wide"
                  >
                    {config?.header || key}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr
                key={index}
                className={`transition duration-150 hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
              >
                {columns.map((key) => {
                  const config = columnConfig[key];
                  const value = item[key];
                  const renderedValue = config?.render
                    ? config.render(value)
                    : value ?? 'N/A';

                  return (
                    <td
                      key={key}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                    >
                      {renderedValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoadConditionsTable;
