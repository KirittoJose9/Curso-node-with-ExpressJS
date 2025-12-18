const errorHandler = (err, req, res, next) => {
    const statusCode = req.statusCode || 500;
    const message = err.message|| 'Error interno.';

    console.error(`[ERROR] ${new Date().toISOString()} - ${statusCode} - ${message}`);

    if (err.stack)
        console.error(err.stack);

    res.status(statusCode).json({
        status : 'error',
        statusCode,
        message,
        ...(process.env.Node_ENV === 'development' && {stack: err.stack})
    });
};

module.exports = errorHandler;