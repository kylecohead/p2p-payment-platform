import { useState, useEffect } from "react";
import "./TurtleMascot.css";

export default function SafePayBot({ isPasswordFocused, showPassword }) {
  const [isBlindfolded, setIsBlindfolded] = useState(false);

  useEffect(() => {
    if (isPasswordFocused) {
      setIsBlindfolded(true);
    } else {
      setIsBlindfolded(false);
    }
  }, [isPasswordFocused]);

  return (
    <div className="safepay-bot">
      <div className="bot-container">
        {/* Robot head with helmet */}
        <div className="bot-head">
          {/* Helmet base */}
          <div className="helmet">
            <div className="helmet-ridge helmet-ridge-1"></div>
            <div className="helmet-ridge helmet-ridge-2"></div>
            <div className="helmet-vent"></div>
          </div>

          {/* Antenna */}
          <div className="antenna">
            <div className="antenna-light"></div>
          </div>

          {/* Eyes - always visible, visor opacity controls visibility */}
          <div className="bot-eye bot-eye-left">
            <div className="eye-pupil"></div>
            <div className="eye-shine"></div>
          </div>
          <div className="bot-eye bot-eye-right">
            <div className="eye-pupil"></div>
            <div className="eye-shine"></div>
          </div>

          {/* Privacy visor - always present, closes when needed */}
          <div
            className={`privacy-visor ${
              isBlindfolded
                ? showPassword
                  ? "closed-transparent"
                  : "closed"
                : "open"
            }`}
          >
            <div className="visor-reflection"></div>
            <div className="visor-line visor-line-1"></div>
            <div className="visor-line visor-line-2"></div>
          </div>

          {/* Mouth */}
          <div className="bot-mouth">
            <div className="mouth-line"></div>
          </div>

          {/* Face panel lines */}
          <div className="face-panel face-panel-1"></div>
          <div className="face-panel face-panel-2"></div>
        </div>

        {/* Robot body */}
        <div className="bot-body">
          {/* Chest panel */}
          <div className="chest-panel">
            <div className="status-light status-light-1"></div>
            <div className="status-light status-light-2"></div>
            <div className="status-light status-light-3"></div>
            <div className="chest-logo">$</div>
          </div>

          {/* Body segments */}

          <div className="body-segment body-segment-2"></div>
        </div>

        {/* Robot arms with three joints */}
        <div className="bot-arm bot-arm-left">
          <div className="arm-segment arm-segment-1">
            <div className="arm-joint arm-joint-1"></div>
          </div>
          <div className="arm-segment arm-segment-2">
            <div className="arm-joint arm-joint-2"></div>
          </div>
          <div className="arm-segment arm-segment-3">
            <div className="arm-joint arm-joint-3"></div>
            <div className="bot-hand">
              <div className="finger finger-1"></div>
              <div className="finger finger-2"></div>
              <div className="finger finger-3"></div>
            </div>
          </div>
        </div>
        <div className="bot-arm bot-arm-right">
          <div className="arm-segment arm-segment-1">
            <div className="arm-joint arm-joint-1"></div>
          </div>
          <div className="arm-segment arm-segment-2">
            <div className="arm-joint arm-joint-2"></div>
          </div>
          <div className="arm-segment arm-segment-3">
            <div className="arm-joint arm-joint-3"></div>
            <div className="bot-hand">
              <div className="finger finger-1"></div>
              <div className="finger finger-2"></div>
              <div className="finger finger-3"></div>
            </div>
          </div>
        </div>

        {/* Construction roller - single track connected to body */}
        <div className="construction-roller">
          <div className="roller-body">
            <div className="roller-surface">
              {/* Textured treads */}
              <div className="tread tread-1"></div>
              <div className="tread tread-2"></div>
              <div className="tread tread-3"></div>
              <div className="tread tread-4"></div>
              <div className="tread tread-5"></div>
              <div className="tread tread-6"></div>
              <div className="tread tread-7"></div>
              <div className="tread tread-8"></div>
            </div>
            <div className="roller-hub roller-hub-left"></div>
            <div className="roller-hub roller-hub-right"></div>
          </div>
          <div className="roller-connector"></div>
        </div>
      </div>
    </div>
  );
}
