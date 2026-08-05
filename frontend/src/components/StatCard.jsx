function StatCard({
  icon,
  title,
  value,
  subtitle,
}) {
  return (
    <div className="statCard">

      <div className="statTop">

        <div className="statIcon">
          {icon}
        </div>

        <span className="statPulse">
          LIVE
        </span>

      </div>

      <h2>{value}</h2>

      <p>{title}</p>

      <small>{subtitle}</small>

    </div>
  );
}

export default StatCard;
