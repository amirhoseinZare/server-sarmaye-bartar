module.exports = (error, req, res, next)=>{
    res.status(error.code).render('html/500', {error:error, success:false, result:null})
}