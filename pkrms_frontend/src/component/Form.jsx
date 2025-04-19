import React, { useState, useEffect, useCallback,  useRef } from "react";
import * as XLSX from "xlsx";
import "../css/Form.css";
import { fetchProvinceList, filterKabupatenList } from "../Services/services";
import { motion } from "framer-motion";
import Modal from "./Model";

/**
 * Form Component
 * Handles user inputs, file uploads, and data submission for road infrastructure data
 */
function Form() {
  // ======== STATE MANAGEMENT ========
  
  // Form selection states
  const [status, setStatus] = useState(""); // Provincial or Kabupaten selection
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedKabupaten, setSelectedKabupaten] = useState("");
  const [provinces, setProvinces] = useState([]);
  const [kabupatenList, setKabupatenList] = useState([]);
  
  // Modal states
  const [modalMessages, setModalMessages] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  // File management states
  const [files, setFiles] = useState({});
  const [excelJson, setExcelJson] = useState({});
  
  // Form submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [output, setOutput] = useState(null);
  
  // Active section state
  const [activeSection, setActiveSection] = useState(null);
  
  // Form data state
  const [FormData, setFormData] = useState({
    provincial: { lgName: "", email: "", phone: "" },
    kabupaten: { lgName: "", email: "", phone: "" },
  });
  
  // Section configuration state - defines all file upload sections
  const [sections, setSections] = useState({
    unitCosts: {
      label: "Unit Cost Section",
      files: [
        "Unit Costs ",
        "Unit Costs PER Unpaved",
        "Unit Costs REH",
        "Unit Costs RIGID",
        "Unit Costs RM",
        "Unit Costs UPG Unpaved",
        "Unit Costs Widening",
        "Unit Costs Standard",
      ],
      enabled: true,
    },
    parameters: {
      label: "Parameters",
      files: ["CODE AN Parameters", "CODE AN WidthStandards"],
      enabled: true,
    },
    map: {
      label: "Links",
      files: [
        { name: "Link", enabled: true, required: true },
        { name: "Alignment", enabled: false },
        { name: "DRP", enabled: false },
      ],
      enabled: true,
    },
    survey: {
      label: "Survey",
      files: [
        { name: "Road Inventory", enabled: true, required: true },
        { name: "Road Condition", enabled: false },
        { name: "Road Hazard", enabled: false },
      ],
      enabled: true,
      required: true,
    }
  });
  
  // Define structure and traffic sections at the top level
  const [structureFiles] = useState([
    "Culvert Inventory", 
    "Retaining WallInventory", 
    "Culvert Condition", 
    "Retaining Wall condition", 
    "Bridge Inventory"
  ]);
  
  const [trafficFiles] = useState([
    "Traffic Volume", 
    "Weighting Inventory"
  ]);

  // ======== EFFECTS ========
  
  /**
   * Load provinces list on component mount
   */
  useEffect(() => {
    setProvinces(fetchProvinceList());
  }, []);
  
  /**
   * Manage section availability based on completed uploads
   * - Structure section becomes available when Survey is complete
   * - Traffic section becomes available when Structure is complete
   */
  useEffect(() => {
    const unitCostsComplete = sections.unitCosts.files.every(fileKey => 
      typeof fileKey === 'string' ? files[fileKey] : files[fileKey.name]
    );
    
    const parametersComplete = sections.parameters.files.every(fileKey => 
      typeof fileKey === 'string' ? files[fileKey] : files[fileKey.name]
    );
    
    const linkUploaded = !!files['Link'];

    setSections(prev => ({
      ...prev,
      parameters: { ...prev.parameters, enabled: unitCostsComplete },
      map: { ...prev.map, enabled: parametersComplete },
      survey: { ...prev.survey, enabled: linkUploaded },
    }));
  }, [files]);

  /**
   * Update file enablement based on file uploads
   * - Link section: Enable Alignment and DRP when Link is uploaded
   * - Survey section: Enable Road Condition and Road Hazard when Road Inventory is uploaded
   */
  useEffect(() => {
    // Handle Link section dependencies
    if (files['Link']) {
      setSections(prev => {
        const updatedMapFiles = prev.map.files.map(file => {
          if (typeof file === 'object' && (file.name === 'Alignment' || file.name === 'DRP')) {
            return { ...file, enabled: true };
          }
          return file;
        });
        
        return {
          ...prev,
          map: {
            ...prev.map,
            files: updatedMapFiles
          }
        };
      });
    }
    
    // Handle Survey section dependencies
    if (files['Road Inventory']) {
      setSections(prev => {
        const updatedSurveyFiles = prev.survey.files.map(file => {
          if (typeof file === 'object' && (file.name === 'Road Condition' || file.name === 'Road Hazard')) {
            return { ...file, enabled: true };
          }
          return file;
        });
        
        return {
          ...prev,
          survey: {
            ...prev.survey,
            files: updatedSurveyFiles
          }
        };
      });
    }
  }, [files]);

  // ======== EVENT HANDLERS ========
  
  /**
   * Handles province selection change
   * Updates the kabupaten list based on selected province
   */
  const handleProvinceChange = useCallback(
    (e) => {
      const selectedLG = e.target.value;
      const province = provinces.find((p) => p.LG === selectedLG);
      if (!province) return;

      setSelectedProvince(selectedLG);
      setSelectedKabupaten("");
      setKabupatenList(filterKabupatenList(province.adm_code));
    },
    [provinces]
  );

  /**
   * Updates form data fields when user inputs values
   * @param {Object} e - Event object
   * @param {String} type - Form type (provincial or kabupaten)
   * @param {String} field - Field name to update
   */
  const handleInputChange = useCallback((e, type, field) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
  }, []);


  const prevSectionsRef = useRef(sections);

  // Effect to handle section disable and file cleanup
  useEffect(() => {
    const prevSections = prevSectionsRef.current;

    // Check each section for disable transitions
    Object.entries(sections).forEach(([sectionKey, currentSection]) => {
      const prevSection = prevSections[sectionKey];
      
      // If section was enabled and is now disabled
      if (prevSection?.enabled && !currentSection.enabled) {
        // Extract all file keys from the section
        const filesToRemove = currentSection.files.map(file => 
          typeof file === 'string' ? file : file.name
        );

        // Remove files from state
        setFiles(prevFiles => {
          const newFiles = { ...prevFiles };
          filesToRemove.forEach(fileKey => delete newFiles[fileKey]);
          return newFiles;
        });

        setExcelJson(prevExcel => {
          const newExcel = { ...prevExcel };
          filesToRemove.forEach(fileKey => delete newExcel[fileKey]);
          return newExcel;
        });
      }
    });

    // Update previous sections reference
    prevSectionsRef.current = sections;
  }, [sections]); // Trigger when sections change



  /**
   * Handles file uploads and processes Excel files
   * @param {Object} e - Event object
   * @param {String} key - File identifier
   */
  const handleFileChange = useCallback(async (e, key) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file extension
    const validExtensions = ['.xls', '.xlsx'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(`.${fileExtension}`)) {
      setModalMessages(["Only Excel files (.xls, .xlsx) are allowed"]);
      setShowModal(true);
      e.target.value = ''; // Clear the file input
      return;
    }
  
    try {
      // Read and process Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "buffer" });
      
      // Process all sheets in the workbook
      const allData = {};
      workbook.SheetNames.forEach(sheetName => {
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        // Convert array to object with record keys
        const records = {};
        jsonData.forEach((row, index) => {
          records[`record_${index + 1}`] = row;
        });
        allData[sheetName] = records;
      });
  
      // Store file reference and processed data
      const firstSheetName = workbook.SheetNames[0];
      setFiles(prev => {
        if (prev[key]?.name === file.name) return prev; // Prevent update if same file
        return { ...prev, [key]: file };
      });
      setExcelJson((prev) => ({ 
        ...prev, 
        [key]: allData[firstSheetName] // This now contains record keys
      }));
    } catch (error) {
      setModalMessages(["Error reading Excel file. Please check the file format."]);
      setShowModal(true);
      console.error(error);
    }
  }, []);

  /**
   * Removes a file from the state
   * @param {String} key - File identifier to remove
   */
  const dependencyMap = {
    'Link': ['Alignment', 'DRP'],
    'Road Inventory': ['Road Condition', 'Road Hazard']
  };
  
  // Update the removeFile function to handle dependent files
  const removeFile = useCallback((key) => {
    setFiles(prev => {
      const updatedFiles = { ...prev };
      
      // Remove the specified file and its dependencies
      const removeFileAndDependencies = (fileKey) => {
        delete updatedFiles[fileKey];
        // Remove dependent files recursively
        if (dependencyMap[fileKey]) {
          dependencyMap[fileKey].forEach(dependentKey => {
            removeFileAndDependencies(dependentKey);
          });
        }
      };
      
      removeFileAndDependencies(key);
      return updatedFiles;
    });
  
    setExcelJson((prev) => {
      const updated = { ...prev };
      const removeDataAndDependencies = (fileKey) => {
        delete updated[fileKey];
        if (dependencyMap[fileKey]) {
          dependencyMap[fileKey].forEach(dependentKey => {
            removeDataAndDependencies(dependentKey);
          });
        }
      };
      
      removeDataAndDependencies(key);
      return updated;
    });
  
    // Update section enablement states
    setSections(prev => {
      const newSections = { ...prev };
      
      // Handle Link dependencies
      if (key === 'Link') {
        newSections.map.files = prev.map.files.map(file => 
          typeof file === 'object' ? { ...file, enabled: false } : file
        );
        newSections.map.files[0].enabled = true; // Keep Link enabled
      }
      
      // Handle Road Inventory dependencies
      if (key === 'Road Inventory') {
        newSections.survey.files = prev.survey.files.map(file => 
          typeof file === 'object' ? { ...file, enabled: false } : file
        );
        newSections.survey.files[0].enabled = true; // Keep Road Inventory enabled
      }
      
      return newSections;
    });
  }, []);
  
  // Update the useEffect for file dependencies
  useEffect(() => {
    // Handle Link section dependencies
    setSections(prev => {
      const linkExists = !!files['Link'];
      const updatedMapFiles = prev.map.files.map(file => {
        if (typeof file === 'object') {
          return {
            ...file,
            enabled: file.name === 'Link' ? true : linkExists
          };
        }
        return file;
      });
      
      return {
        ...prev,
        map: {
          ...prev.map,
          files: updatedMapFiles
        }
      };
    });
  
    // Handle Survey section dependencies
    setSections(prev => {
      const roadInventoryExists = !!files['Road Inventory'];
      const updatedSurveyFiles = prev.survey.files.map(file => {
        if (typeof file === 'object') {
          return {
            ...file,
            enabled: file.name === 'Road Inventory' ? true : roadInventoryExists
          };
        }
        return file;
      });
      
      return {
        ...prev,
        survey: {
          ...prev.survey,
          files: updatedSurveyFiles
        }
      };
    });
  }, [files]);
  /**
   * Validates form inputs before submission
   * @returns {Boolean} - Whether all inputs are valid
   */
  const validateInputs = () => {
    // Check dropdown selections
    if (
      !status ||
      !selectedProvince ||
      (status === "kabupaten" && !selectedKabupaten)
    ) {
      setModalMessages(["Please fill out all dropdown fields."]);
      setShowModal(true);
      return false;
    }

    const { lgName, email, phone } = FormData[status];

    // LG Name validation
    if (!lgName.trim()) {
      setModalMessages(["LG Name is required."]);
      setShowModal(true);
      return false;
    }

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setModalMessages(["Please enter a valid email address (e.g., example@domain.com)"]);
      setShowModal(true);
      return false;
    }

    // Phone number validation (only digits, min 9 max 14 characters)
    const phoneRegex = /^[0-9]{9,14}$/;
    if (!phoneRegex.test(phone.replace(/^\+62/, ''))) {
      setModalMessages(["Phone number must be 9 to 14 digits and contain only numbers."]);
      setShowModal(true);
      return false;
    }

    return true;
  };

  /**
   * Submits form data and uploaded files to the server
   * Handles API communication and error handling
   */
  const handleSubmit = async () => {
    if (!validateInputs()) return;
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Format phone number with prefix
    const prependPrefix = (phone) => {
      if (!phone) return "";
      return phone.startsWith("+62") ? phone : `+62${phone.replace(/^0+/, "")}`;
    };

    // Prepare form data
    const currentFormData = FormData[status];
    const preparedFormData = {
      status: status,
      selected_province: selectedProvince,
      selected_kabupaten: status === "kabupaten" ? selectedKabupaten : null,
      lg_name: currentFormData.lgName,
      email: currentFormData.email,
      phone: prependPrefix(currentFormData.phone)
    };
    
    // Create the data structure with FormData as an array
    const jsonData = {
      FormData: [preparedFormData]  // Wrap FormData in an array
    };

    // Add Excel data for each file
    Object.entries(excelJson).forEach(([key, data]) => {
      if (data) { // Directly assign the object with record keys
        jsonData[key] = data;
      }
    });

    console.log('Sending data:', jsonData); // Log the data being sent

    try {
      // Make API request
      const response = await fetch('http://127.0.0.1:8000/api/upload-data/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData),
        signal: AbortSignal.timeout(5000) // Add timeout
      });
  
      const responseData = await response.json();
  
      if (!response.ok) {
        // Process validation errors from server
        let errorMessages = [];
        
        // Handle FormData validation errors
        if (responseData.details?.FormData?.errors) {
          const formErrors = responseData.details.FormData.errors;
          Object.entries(formErrors).forEach(([field, errorObj]) => {
            errorMessages.push(`Form Data Error: ${field} - ${errorObj.errors.join(', ')}`);
          });
        }
  
        // Handle file-specific errors
        if (responseData.details) {
          Object.entries(responseData.details).forEach(([key, errorDetails]) => {
            if (key !== 'FormData') {
              // Extract record number and field errors
              const [fileName, recordNumber] = key.includes('_') 
                ? key.split('_') 
                : [key, 'N/A'];
        
              // Process field-specific errors
              let errorsText = '';
              if (errorDetails.errors) {
                if (Array.isArray(errorDetails.errors)) {
                  errorsText = errorDetails.errors.join(', ');
                } else if (typeof errorDetails.errors === 'object') {
                  errorsText = Object.entries(errorDetails.errors)
                    .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                    .join('; ');
                }
              }
        
              errorMessages.push(
                `Error in ${fileName}${recordNumber !== 'N/A' ? ` (Record ${recordNumber})` : ''}: ${errorsText}`
              );
            }
          });
        }
        
        if (errorMessages.length > 0) {
          throw new Error(
            `One or more validation errors occurred:\n\n${errorMessages.join('\n')}`
          );
        }
  
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }
  
      // Handle successful response
      if (responseData.FormData && responseData.FormData.status === 'validated') {
        setModalMessages(['Data submitted successfully!']);
        setShowModal(true);
      } else {
        console.warn('FormData processing status:', responseData.FormData);
        setModalMessages(['Data was received but there might be an issue with processing. Check console for details.']);
        setShowModal(true);
      }
    } catch (error) {
      // Handle request errors
      console.error('Error details:', error);
      let errorMessage = error.message;
      
      if (error.name === 'AbortError') {
        errorMessage = "Request timed out. Check your connection.";
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = "Unable to connect to the server. Please try again later.";
      }
      
      setModalMessages([errorMessage]);
      setShowModal(true);
    } finally {
      setOutput(jsonData); // Store output data
      setIsSubmitting(false);
    }
  };

  /**
   * Handles section button click
   * @param {String} sectionKey - Key of the section to activate
   */
  const handleSectionClick = (sectionKey) => {
    const section = sections[sectionKey];
    
    if (!section.enabled) {
      // Show message for disabled sections
      const messages = {
        parameters: 'Please complete all Unit Cost uploads to enable Parameters section',
        map: 'Please complete all Parameters uploads to enable Links section',
        survey: 'Please upload at least one Link file to enable Survey section',
      };
      
      setModalMessages([messages[sectionKey] || 'This section is currently disabled']);
      setShowModal(true);
      return;
    }
    
    setActiveSection(activeSection === sectionKey ? null : sectionKey);
  };

  /**
   * Closes the active section
   */
  const handleCloseSection = () => {
    setActiveSection(null);
  };

  // ======== RENDERING HELPER FUNCTIONS ========
  
  /**
   * Renders file upload cards for a specific section
   * @param {Array} fileList - List of files to render
   * @param {Boolean} usesObjectFormat - Whether files are stored as objects with name and enabled properties
   * @returns {JSX.Element} - File upload cards UI
   */
  const renderFileUploadCards = (fileList, usesObjectFormat = false) => {
    return (
      <div className="file-upload-grid">
        {fileList.map((fileItem) => {
          // Handle both string and object file formats
          const key = usesObjectFormat ? fileItem.name : fileItem;
          const isEnabled = usesObjectFormat ? fileItem.enabled : true;
          const isRequired = usesObjectFormat ? fileItem.required : false;
          
          return (
            <div 
              key={key} 
              className={`file-upload-card ${!isEnabled ? 'disabled' : ''}`}
            >
              <div className="file-content">
                {!files[key] ? (
                  <label className={`file-label ${!isEnabled ? 'disabled' : ''}`}>
                    <div className="upload-content">
                      <span className="upload-icon">+</span>
                      <span className="file-title">
                        {key}
                        {isRequired && <span className="required-indicator">*</span>}
                      </span>
                      <p className="file-instruction">
                        {isEnabled ? 'Click to upload' : 'Upload prerequisite files first'}
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      onChange={(e) => handleFileChange(e, key)}
                      className="hidden-input"
                      id={`file-input-${key}`}
                      disabled={!isEnabled}
                    />
                  </label>
                ) : (
                  <div className="file-preview">
                    <div className="file-info">
                      <span className="file-name">{files[key].name}</span>
                      <button
                        className="remove-btn"
                        onClick={() => removeFile(key)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /**
   * Renders active section content
   * @returns {JSX.Element} - Active section UI
   */
  const renderActiveSection = () => {
    if (!activeSection) return null;
    
    const section = sections[activeSection];
    
    return (
      <motion.div 
        className="active-section-container"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="section-header">
          <h3 className="active-section-title">{section.label}</h3>
          <button className="section-close-button" onClick={handleCloseSection}>×</button>
        </div>
        
        {/* Render main section file upload cards */}
        {renderFileUploadCards(section.files, activeSection === 'map' || activeSection === 'survey')}
        
        {/* For Survey section, render additional Structure and Traffic sections directly */}
        {activeSection === 'survey' && (
          <>
            <div className="subsection-container">
              <h4 className="subsection-title">Structure</h4>
              {renderFileUploadCards(structureFiles)}
            </div>
            
            <div className="subsection-container">
              <h4 className="subsection-title">Traffic</h4>
              {renderFileUploadCards(trafficFiles)}
            </div>
          </>
        )}
      </motion.div>
    );
  };

  /**
   * Renders form input fields
   * @param {String} type - Form type (provincial or kabupaten)
   * @returns {JSX.Element} - Form inputs UI
   */
  const renderFormInputs = (type) => (
    <motion.div
      className="form-inputs"
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h3 className="section-title">Details</h3>
      <label htmlFor="lgname">LG Name</label>
      <input
        id="lgname"
        type="text"
        placeholder="Enter LG Name"
        value={FormData[type].lgName}
        onChange={(e) => handleInputChange(e, type, "lgName")}
        className="input-field"
      />
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        placeholder="Enter Email Address"
        value={FormData[type].email}
        onChange={(e) => handleInputChange(e, type, "email")}
        className="input-field"
      />
      <label htmlFor="phone">Phone</label>
      <span className="phone-prefix">+62</span>
      <input
        id="phone"
        type="tel"
        placeholder="Enter Phone Number"
        value={FormData[type].phone}
        onChange={(e) => handleInputChange(e, type, "phone")}
        className="input-field"
      />
    </motion.div>
  );

  /**
   * Calculate progress for each section
   * @param {String} sectionKey - Key of the section
   * @returns {Number} - Progress percentage
   */
  const calculateSectionProgress = (sectionKey) => {
    const section = sections[sectionKey];
    if (!section) return 0;
    
    // Calculate total files
    let totalFiles = 0;
    let uploadedFiles = 0;
    
    // Count enabled files in sections with objects
    if (sectionKey === 'map' || sectionKey === 'survey') {
      const enabledFiles = section.files.filter(file => file.enabled);
      totalFiles = enabledFiles.length;
      uploadedFiles = enabledFiles.filter(file => files[file.name]).length;
    } else {
      // Original counting for simple string arrays
      totalFiles = section.files.length;
      uploadedFiles = section.files.filter(key => files[key]).length;
    }
    
    // Add structure and traffic files to the count for survey section
    if (sectionKey === 'survey') {
      totalFiles += structureFiles.length + trafficFiles.length;
      uploadedFiles += structureFiles.filter(key => files[key]).length;
      uploadedFiles += trafficFiles.filter(key => files[key]).length;
    }
    
    return totalFiles > 0 ? Math.round((uploadedFiles / totalFiles) * 100) : 0;
  };

  /**
   * Get the count of files uploaded out of the total available files
   * @param {String} sectionKey - Key of the section
   * @returns {Object} - Object with uploaded and total counts
   */
  const getSectionFileCounts = (sectionKey) => {
    const section = sections[sectionKey];
    if (!section) return { uploaded: 0, total: 0 };
    
    let uploaded = 0;
    let total = 0;
    
    // For sections with objects
    if (sectionKey === 'map' || sectionKey === 'survey') {
      const enabledFiles = section.files.filter(file => file.enabled);
      total = enabledFiles.length;
      uploaded = enabledFiles.filter(file => files[file.name]).length;
    } else {
      // Original counting for simple string arrays
      total = section.files.length;
      uploaded = section.files.filter(key => files[key]).length;
    }
    
    // Add structure and traffic counts for survey section
    if (sectionKey === 'survey') {
      const structureUploaded = structureFiles.filter(key => files[key]).length;
      const trafficUploaded = trafficFiles.filter(key => files[key]).length;
      
      return {
        uploaded,
        total,
        structureUploaded,
        structureTotal: structureFiles.length,
        trafficUploaded,
        trafficTotal: trafficFiles.length
      };
    }
    
    return { uploaded, total };
  };

  // ======== MAIN COMPONENT RENDER ========
  return (
    <motion.div
      className="form-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Left Form Section - Status and Details */}
      <div className="form-section">
        <h2 className="section-title">Select Status</h2>
        <div className="dropdowns">
          {/* Status Selection */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setSelectedProvince("");
              setSelectedKabupaten("");
              setKabupatenList([]);
            }}
            className="select-status small-select"
          >
            <option value="">-- Select --</option>
            <option value="provincial">Provincial</option>
            <option value="kabupaten">Kabupaten</option>
          </select>

          {/* Province Selection */}
          {status && (
            <select
              value={selectedProvince}
              onChange={handleProvinceChange}
              className="select-status small-select"
            >
              <option value="">-- Select Province --</option>
              {provinces.map((prov) => (
                <option key={prov.adm_code} value={prov.LG}>
                  {prov.LG}
                </option>
              ))}
            </select>
          )}

          {/* Kabupaten Selection */}
          {status === "kabupaten" && (
            <select
              value={selectedKabupaten}
              onChange={(e) => setSelectedKabupaten(e.target.value)}
              className="select-status small-select"
              disabled={!kabupatenList.length}
            >
              <option value="">-- Select Kabupaten --</option>
              {kabupatenList.map((kab) => (
                <option key={kab.adm_code} value={kab.LG}>
                  {kab.LG}
                </option>
              ))}
            </select>
          )}
        </div>
        {/* Form Inputs */}
        {status && renderFormInputs(status)}
      </div>

      {/* Section Buttons Grid */}
      <div className="form-section">
        <h3 className="section-title">Upload Excel Files</h3>
        <div className="section-buttons-grid">
          {Object.entries(sections).map(([sectionKey, section]) => {
            const fileCounts = getSectionFileCounts(sectionKey);
            return (
              <motion.button
                key={sectionKey}
                className={`section-button ${!section.enabled ? 'disabled' : ''} ${activeSection === sectionKey ? 'active' : ''}`}
                onClick={() => handleSectionClick(sectionKey)}
                disabled={!section.enabled}
                whileHover={section.enabled ? { scale: 1.03 } : {}}
                whileTap={section.enabled ? { scale: 0.97 } : {}}
              >
                <div className="section-button-content">
                  <span className="section-label">{section.label}</span>
                  {section.required && <span className="required-badge">Required</span>}
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${calculateSectionProgress(sectionKey)}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">
                    {fileCounts.uploaded}/{fileCounts.total} files
                    {sectionKey === 'survey' && 
                      ` + ${fileCounts.structureUploaded}/${fileCounts.structureTotal} structure + ${fileCounts.trafficUploaded}/${fileCounts.trafficTotal} traffic`
                    }
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
        
        {/* Active Section File Uploads */}
        {renderActiveSection()}
        
        {/* Submit Button */}
        <button onClick={handleSubmit} className="button-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {/* Output Display */}
      {output && (
        <div className="output-box">
          <pre>{JSON.stringify(output, null, 2)}</pre>
        </div>
      )}
      
      {/* Modal Display */}
      {showModal && (
        <Modal
          show={showModal}
          title="Notification"
          messages={modalMessages}
          onClose={() => setShowModal(false)}
        />
      )}
    </motion.div>
  );
}

export default Form;