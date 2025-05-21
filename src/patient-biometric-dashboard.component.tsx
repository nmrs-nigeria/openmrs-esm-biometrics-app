import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import leftThumb from './assets/images/LEFT_THUMB.png';
import leftIndex from './assets/images/LEFT_INDEX.png';
import leftMiddle from './assets/images/LEFT_MIDDLE.png';
import leftRing from './assets/images/LEFT_RING.png';
import leftLittle from './assets/images/LEFT_LITTLE.png';
import rightThumb from './assets/images/RIGHT_THUMB.png';
import rightIndex from './assets/images/RIGHT_INDEX.png';
import rightMiddle from './assets/images/RIGHT_MIDDLE.png';
import rightRing from './assets/images/RIGHT_RING.png';
import rightLittle from './assets/images/RIGHT_LITTLE.png';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { showModal } from '@openmrs/esm-framework';

import styles from './root.scss';
/**
 * From here, the application is pretty typical React, but with lots of
 * support from `@openmrs/esm-framework`. Check out `Greeter` to see
 * usage of the configuration system, and check out `PatientGetter` to
 * see data fetching using the OpenMRS FHIR API.
 *
 * Check out the Config docs:
 *   https://openmrs.github.io/openmrs-esm-core/#/main/config
 */

const biometricUrl = "http://localhost:2018/api/FingerPrint"; // TODO: Replace with actual value or prop
const authenticatedUserId = "admin"; // TODO: Replace with actual value or prop

const apiFingerPosition = {
  RightThumb: 1,
  RightIndex: 2,
  RightMiddle: 3,
  RightWedding: 4,
  RightSmall: 5,
  LeftThumb: 6,
  LeftIndex: 7,
  LeftMiddle: 8,
  LeftWedding: 9,
  LeftSmall: 10,
};
const fingerPosition = [
  '',
  'RIGHT_THUMB',
  'RIGHT_INDEX',
  'RIGHT_MIDDLE',
  'RIGHT_RING',
  'RIGHT_LITTLE',
  'LEFT_THUMB',
  'LEFT_INDEX',
  'LEFT_MIDDLE',
  'LEFT_RING',
  'LEFT_LITTLE',
];
const defaultImages = [
  null,
  rightThumb,
  rightIndex,
  rightMiddle,
  rightRing,
  rightLittle,
  leftThumb,
  leftIndex,
  leftMiddle,
  leftRing,
  leftLittle,
];

function getUrlVars() {
  const vars: Record<string, string> = {};
  window.location.href
    .slice(window.location.href.indexOf('?') + 1)
    .split('&')
    .forEach((hash) => {
      const [key, value] = hash.split('=');
      if (key) vars[key] = value;
    });
  return vars;
}

import { LaboratoryPictogram, PageHeader, useDefineAppContext } from '@openmrs/esm-framework';


const PatientBiometricDashboard: React.FC = () => {
  const { t } = useTranslation();

  const useModalManager = () => {
    const modalDisposerRef = useRef<(() => void) | null>(null);

    const launchCompleteModal = useCallback(() => {
      const dispose = showModal('loading-modal', {
        title: 'Validating...please wait',
        closeModal: () => {
          dispose?.(); // Internal close
          modalDisposerRef.current = null;
        },
      });

      modalDisposerRef.current = dispose;
    }, []);

    const alertModal = useCallback((title: string, isAlert: boolean) => {
      const dispose = showModal('loading-modal', {
        title: title,
        isAlert: isAlert,
        closeModal: () => {
          dispose?.(); // Internal close
          modalDisposerRef.current = null;
        },
      });

      modalDisposerRef.current = dispose;
    }, []);

    const closeModal = useCallback(() => {
      if (modalDisposerRef.current) {
        modalDisposerRef.current(); // External close
        modalDisposerRef.current = null;
      }
    }, []);

    return {
      launchCompleteModal,
      closeModal,
      alertModal
    };
  };


  const [patientId, setPatientId] = useState<string | undefined>(undefined);
  const [capturedPrint, setCapturedPrint] = useState<any[]>([]);
  const [fingerImages, setFingerImages] = useState<(string | null)[]>([...defaultImages]);
  const [modal, setModal] = useState<'none' | 'loading' | 'capture'>('none');
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [recaptureCount, setRecaptureCount] = useState<string>('0');
  const [recaptureBaseCheck, setRecaptureBaseCheck] = useState<string>('');
  const [showBaseReplacementFlag, setShowBaseReplacementFlag] = useState(false);
  const [fpVerifyBtnHidden, setFpVerifyBtnHidden] = useState(false);
  const [nextRecaptureFlagVisible, setNextRecaptureFlagVisible] = useState(false);
  const { launchCompleteModal, closeModal, alertModal } = useModalManager();
  const [buttonStates, setButtonStates] = useState<{ [key: string]: { disabled: boolean, recapture: boolean, quality?: string } }>(() => {
    const obj: any = {};
    fingerPosition.forEach((pos, idx) => {
      if (pos) obj[pos] = { disabled: false, recapture: false };
    });
    return obj;
  });
  const [saveEnabled, setSaveEnabled] = useState(false);

  // Extract patientId from URL on mount
  useEffect(() => {
    const vars = getUrlVars();
    setPatientId(vars["patientId"]);
  }, []);

  // Fetch previous captures on patientId change
  useEffect(() => {
    launchCompleteModal();
    const pathArray = location.pathname.split('/test/');
    const patientId = "757a1d35-2f38-4eb3-a4c7-13a30fdf2f6d";//pathArray[pathArray.length - 1];
    if (!patientId) return;
    // setModal('loading');
    fetch(`${biometricUrl}/CheckForPreviousCapture?PatientUUID=${patientId}`)
      .then(res => res.json())
      .then(async data => {
        alert("dfdf")
        closeModal();
        if (data && data.length > 0) {
          await getRecaptureCount();
          let lowQuality = false;
          let invalid = false;
          const newButtonStates = { ...buttonStates };
          data.forEach((item: any) => {
            const pos = apiFingerPosition[item.fingerPositions];
            if (item.qualityFlag?.toLowerCase() === 'low') {
              lowQuality = true;
              newButtonStates[fingerPosition[pos]] = { ...newButtonStates[fingerPosition[pos]], recapture: true, quality: 'low' };
            } else if (item.qualityFlag?.toLowerCase() === 'invalid') {
              invalid = true;
              newButtonStates[fingerPosition[pos]] = { ...newButtonStates[fingerPosition[pos]], recapture: true, quality: 'invalid' };
            } else {
              newButtonStates[fingerPosition[pos]] = { ...newButtonStates[fingerPosition[pos]], disabled: true };
            }
          });
          setButtonStates(newButtonStates);
          await getBaseCheck();
          if (lowQuality && invalid) {
            alert('Fingerprints of this patient contains invalid and low quality data and will need to be recaptured');
          }
          /*  else if (lowQuality) setAlertMsg('Some fingerprints for this patient are of low quality and will need to be recaptured');
           else if (invalid) setAlertMsg('Some fingerprints for this patient are invalid and will need to be recaptured'); */
          // else{ alertModal('Finger Print already captured for this patient', true);}
          else alert('Finger Print already captured for this patient');
        }
      })
      .catch(err => {
        closeModal();
        alert('System error. Please check that the Biometric service is running')
      });
  }, [patientId]);

  const getRecaptureCount = async () => {
    try {
      const response = await fetch(`${biometricUrl}/recaptureCount`);
      const data = await response.json();

      if (data) {
        const arrCount = data.toString().split(',');
        setRecaptureCount(arrCount[0]);

        // Check if base replacement is needed
        if (parseInt(arrCount[1]) > 0) {
          setShowBaseReplacementFlag(true);
        }

        // Get base check status
        // await getBaseCheck();
      }
    } catch (error) {
      alert('System error. Please check that the Biometric service is running');
    }
  };

  const getBaseCheck = async () => {
    try {
      const response = await fetch(`${biometricUrl}/recaptureBaseCheck`);
      const data = await response.json();

      if (data) {
        const arr = data.toString().split(',');
        console.log(arr[0]);
        setRecaptureBaseCheck(data);
        alert(recaptureCount)
        // Check if base capture was captured today
        if (arr[0].toString() === 'true') {

          setFpVerifyBtnHidden(false);
          setNextRecaptureFlagVisible(true);
        }

        // Check if base capture was not captured today and recapture > 14 days
        if (arr[0].toString() === 'false' && arr[1].toString() === 'true' && parseInt(recaptureCount) > 0) {

          alert(recaptureCount)
          setFpVerifyBtnHidden(true);
          setNextRecaptureFlagVisible(false);
        }

        // Check if no base capture and no recapture needed
        if (arr[0].toString() === 'false' && arr[1].toString() === 'false' && parseInt(recaptureCount) === 0) {
          setFpVerifyBtnHidden(true);
          setNextRecaptureFlagVisible(false);
        }

        // Check if recapture needed
        if (arr[1].toString() === 'false' && parseInt(recaptureCount) > 0) {
          setNextRecaptureFlagVisible(true);
        }
      }
    } catch (error) {
      alert('System error. Please check that the Biometric service is running');
    }
  };

  // Alert dialog
  const handleAlertClose = () => {
    setModal('none');
    setAlertMsg(null);
  };

  // Capture fingerprint
  const captureFP = (position: number) => {
    launchCompleteModal();
    const pathArray = location.pathname.split('/test');
    const patientId = pathArray[pathArray.length - 1];
    alert(patientId)

    setTimeout(() => {
      closeModal();
    }, 2000);


  };

  // Recapture fingerprint
  const recaptureFP = (position: number) => {
    alert(position)
    /*  setModal('capture');
     fetch(`${biometricUrl}/reCapturePrint?fingerPosition=${position}&patientId=${patientId}`)
       .then(res => res.json())
       .then(data => {
         setModal('none');
         if (!data.ErrorMessage) {
           const imgId = fingerPosition[position];
           const newImages = [...fingerImages];
           newImages[position] = `data:image/bmp;base64,${data.Image}`;
           setFingerImages(newImages);
           setSaveEnabled(true);
           const newPrint = { ...data, Image: '', creator: authenticatedUserId };
           setCapturedPrint(prev => {
             const idx = prev.findIndex(item => item.FingerPositions === data.FingerPositions);
             if (idx !== -1) {
               const updated = [...prev];
               updated[idx] = newPrint;
               return updated;
             } else {
               return [...prev, newPrint];
             }
           });
         } else if (data.ErrorCode === "-1") {
           setAlertMsg('Fingerprint is of low quality kindly recapture');
         } else {
           setAlertMsg(data.ErrorMessage);
         }
       })
       .catch(() => {
         setModal('none');
         setAlertMsg('System error. Please check that the Biometric service is running');
       }); */
  };

  // Save prints
  const Save = () => {
    setModal('loading');
    const saveUrl = `${biometricUrl}/SaveToDatabase`;
    const model = { FingerPrintList: capturedPrint, PatientUUID: patientId };
    fetch(saveUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(model),
    })
      .then(res => res.json())
      .then(response => {
        setModal('none');
        setAlertMsg(response.ErrorMessage);
        window.location.reload();
      })
      .catch(() => {
        setModal('none');
        setAlertMsg('System error. Please check that the Biometric service is running');
        window.location.reload();
      });
  };

  // Delete prints
  const deletePrints = () => {
    setModal('loading');
    if (window.confirm('Are you sure you want to delete these prints?')) {
      const deleteUrl = `${biometricUrl}/deleteFingerPrint?patientId=${patientId}`;
      fetch(deleteUrl, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } })
        .then(() => {
          setModal('none');
          setAlertMsg('Record deleted successfully!');
          window.location.reload();
        })
        .catch(() => {
          setModal('none');
          setAlertMsg('System error. Please check that the Biometric service is running');
        });
    } else {
      setModal('none');
    }
  };

  const handleFpVerification = () => {
    const newButtonStates = { ...buttonStates };
    fingerPosition.forEach((pos, idx) => {
      if (pos) {
        newButtonStates[pos] = { ...newButtonStates[pos], disabled: false, recapture: false };
      }
    });
    setButtonStates(newButtonStates);
    setSaveEnabled(true);
  };

  // UI helpers
  const renderButton = (pos: string, idx: number) => {
    const state = buttonStates[pos] || { disabled: false, recapture: false };
    if (state.recapture) {
      return (
        <input
          type="button"
          value="Scan"
          id={`BTN_${pos}`}
          onClick={() => recaptureFP(idx)}
          style={{ background: state.quality === 'low' ? '#ffe066' : state.quality === 'invalid' ? '#ff6f6f' : undefined }}
        />
      );
    }
    return (
      <input
        type="button"
        value="Scan"
        id={`BTN_${pos}`}
        onClick={() => captureFP(idx)}
        disabled={state.disabled}
      />
    );
  };

  return (
    <div>

      <div className={styles.customHeader}>
        <div className={styles.logo}>
          <div className={styles.logoInner}>
            <LaboratoryPictogram />
            <div className={styles.logoRight}>
              <h2>Capture Patient Biometrics</h2>
              {fpVerifyBtnHidden && (<button onClick={deletePrints} id="deleteBtn" className={styles.btnGlobal} style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', cursor: 'pointer', backgroundColor: '#dc3545' }}>Delete Fingerprints</button>)}
              {fpVerifyBtnHidden && <button onClick={() => handleFpVerification()} id="fpVerfiyBtn" hidden={fpVerifyBtnHidden} className={styles.btnGlobal} style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', cursor: 'pointer', backgroundColor: '#0d6efd' }}>Re-Capture</button>}
            </div>
          </div>
        </div>
        <div className={styles.rightText}>
          {recaptureCount && (<span id="countFP" className={styles.recaptureCount}>Recapture Count: {recaptureCount}</span>)}
          {showBaseReplacementFlag && (<div id="basereplacementFlag" className={styles.fpcaptured}>The base fingerprint was replaced for this patient!</div>)}
          {nextRecaptureFlagVisible && (<div id="nextrecaptureFlag" className={styles.noFpcaptured}>Biometric recapture is unavailable at this time. Please note that it must be at least two weeks since your last capture.</div>)}
        </div>
      </div>


      <div className={styles.container}>
        {/* Modal overlays */}
        {modal !== 'none' && (
          <div className="react-modal-overlay">
            <div className="react-modal-content">
              <img src="../moduleResources/nigeriaemr/images/Sa7X.gif" alt="Loading Gif" style={{ width: '100px' }} />
              <div style={{ marginTop: 16 }}>
                {modal === 'loading' ? 'Loading...please wait' : 'Validating...please wait'}
              </div>
            </div>
          </div>
        )}
        {/* Alert dialog */}
        {alertMsg && (
          <div className="react-modal-overlay">
            <div className="react-modal-content">
              <div>{alertMsg}</div>
              <button onClick={handleAlertClose} style={{ marginTop: 16 }}>OK</button>
            </div>
          </div>
        )}


        <table className={styles.page}>
          <tbody>
            <tr>
              {[6, 7, 8, 9, 10].map(idx => (
                <td key={fingerPosition[idx]}>
                  <h6 id={`H_${fingerPosition[idx]}`} style={{ backgroundColor: 'red', color: 'white', display: 'none' }}></h6>
                  <img
                    id={fingerPosition[idx]}
                    alt={fingerPosition[idx].replace('_', ' ')}
                    height={200}
                    width={150}
                    src={fingerImages[idx] || ''}
                  />
                  <div className={styles["percent-circle"]}>0%</div>
                  {renderButton(fingerPosition[idx], idx)}
                </td>
              ))}
            </tr>
            <tr>
              {[6, 7, 8, 9, 10].map(idx => (
                <td key={fingerPosition[idx] + '_info'}><p id={`${fingerPosition[idx]}_INFO`}></p></td>
              ))}
            </tr>
            <tr>
              {[1, 2, 3, 4, 5].map(idx => (
                <td key={fingerPosition[idx]}>
                  <h6 id={`H_${fingerPosition[idx]}`} style={{ backgroundColor: 'red', color: 'white', display: 'none' }}></h6>
                  <img
                    id={fingerPosition[idx]}
                    alt={fingerPosition[idx].replace('_', ' ')}
                    height={200}
                    width={150}
                    src={fingerImages[idx] || ''}
                  />
                  <div className={styles["percent-circle"]}>0%</div>
                  {renderButton(fingerPosition[idx], idx)}
                </td>
              ))}
            </tr>
            <tr>
              {[1, 2, 3, 4, 5].map(idx => (
                <td key={fingerPosition[idx] + '_info'}><p id={`${fingerPosition[idx]}_INFO`}></p></td>
              ))}
            </tr>
          </tbody>
        </table>
        <div>
          <input type="button" value="Reset" onClick={() => window.location.reload()} />
          <input
            type="button"
            value="Save"
            id="saveBiometric"
            className="confirm button"
            onClick={Save}
            disabled={!saveEnabled}
          />
        </div>
      </div>
    </div>
  );
};

export default PatientBiometricDashboard;
