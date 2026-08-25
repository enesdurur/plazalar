import { CalibrationForm } from "../calibration-form";
import { createCalibration } from "../actions";

export default function NewCalibrationPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Yeni Kalibrasyon Kaydı</h1>
      <div className="mt-6">
        <CalibrationForm action={createCalibration} />
      </div>
    </div>
  );
}
