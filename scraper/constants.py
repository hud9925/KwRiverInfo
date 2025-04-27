CODES = {"HG", "QR", "TA", "TW", "UD", "US"}

FULL = {
    "HG": "Height – River Stage",
    "QR": "Discharge – River (cms)",
    "TA": "Temperature – Air",
    "TW": "Temperature – Water",
    "UD": "Wind – Direction",
    "US": "Wind – Speed",
}

UNITS = dict(HG="m", QR="m³/s", TA="°C", TW="°C", UD="°", US="m/s")
CHUNK = 3          # ts_ids per KiWIS call
THROTTLE_S = 0.2   # pause between calls
