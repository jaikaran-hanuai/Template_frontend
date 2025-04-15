from django.db import models

class CODE_AN_UnitCostsREH(models.Model):
    id = models.AutoField(primary_key=True,db_column='id')
    admin_code = models.IntegerField(null=True, blank=True,db_column='adminCode')
    cumesa1 = models.FloatField(null=True, blank=True, db_column='cumesa1')
    cumesa2 = models.FloatField(null=True, blank=True, db_column='cumesa2')
    pave_width1 = models.FloatField(null=True, blank=True, db_column='paveWidth1')
    pave_width2 = models.FloatField(null=True, blank=True, db_column='paveWidth2')
    reh_unitcost = models.FloatField(null=True, blank=True, db_column='rehUnitcost')

    def __str__(self):
        return f"{self.admin_code}"
    
    class Meta:
        db_table = 'code_an_unitcostsreh'
        verbose_name = 'Code An Unitcostsreh'
        verbose_name_plural = 'Code An Unitcostsrehs'
